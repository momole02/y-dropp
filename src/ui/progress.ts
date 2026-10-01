import cliProgress from 'cli-progress';
import ora, { Ora } from 'ora';
import { formatDuration, formatSize, formatSpeed } from '../utils/size';
import { isFancy, padEnd, symbols, theme, truncate } from './theme';

interface ActiveUpload {
  name: string;
  total: number;
  received: number;
  startedAt: number;
  from: string;
  bar?: cliProgress.SingleBar;
}

export interface SessionStats {
  files: number;
  bytes: number;
  failed: number;
  startedAt: number;
}

/** Largeur du nom de fichier dans la barre, adaptée à la largeur du terminal. */
function nameWidth(): number {
  const columns = process.stdout.columns || 80;
  // barre, pourcentage, tailles, débit et temps restant occupent ~70 colonnes
  return Math.max(10, Math.min(32, columns - 72));
}

/**
 * Affichage terminal des transferts : spinner d'attente, une barre de progression
 * par fichier en cours, puis une ligne de résultat par fichier.
 */
export class UploadMonitor {
  private spinner?: Ora;
  private multibar?: cliProgress.MultiBar;
  private readonly active = new Map<string, ActiveUpload>();
  readonly stats: SessionStats = { files: 0, bytes: 0, failed: 0, startedAt: Date.now() };

  /** Affiche « En attente de fichiers… » quand rien n'est en cours. */
  waiting(): void {
    if (!isFancy() || this.active.size > 0) return;
    if (!this.spinner) {
      this.spinner = ora({ text: theme.dim('En attente de fichiers…  (Ctrl+C pour arrêter)'), color: 'magenta', spinner: 'dots' });
    }
    if (!this.spinner.isSpinning) this.spinner.start();
  }

  /** Écrit une ligne au-dessus des barres / du spinner. */
  print(line: string): void {
    if (this.multibar) {
      this.multibar.log(`${line}\n`);
    } else if (this.spinner?.isSpinning) {
      this.spinner.stop();
      console.log(line);
      this.spinner.start();
    } else {
      console.log(line);
    }
  }

  start(id: string, name: string, total: number, from: string): void {
    const upload: ActiveUpload = { name, total, received: 0, startedAt: Date.now(), from };
    this.active.set(id, upload);
    if (!isFancy()) {
      console.log(`${symbols.arrow} Réception de ${name} (${total > 0 ? formatSize(total) : 'taille inconnue'}) depuis ${from}`);
      return;
    }
    this.spinner?.stop();
    if (!this.multibar) {
      this.multibar = new cliProgress.MultiBar(
        {
          format: `${theme.accent('{bar}')} {percentage}% {name} ${theme.dim('{done}/{size} · {speed} · {eta}')}`,
          barCompleteChar: '█',
          barIncompleteChar: '░',
          barsize: 16,
          hideCursor: true,
          clearOnComplete: true,
          stopOnComplete: false,
          fps: 8,
          autopadding: true,
        },
        cliProgress.Presets.shades_classic,
      );
    }
    upload.bar = this.multibar.create(Math.max(total, 1), 0, this.payload(upload));
  }

  progress(id: string, received: number): void {
    const upload = this.active.get(id);
    if (!upload) return;
    upload.received = received;
    upload.bar?.update(Math.min(received, Math.max(upload.total, 1)), this.payload(upload));
  }

  complete(id: string, finalName: string, size: number): void {
    const upload = this.active.get(id);
    const duration = upload ? Date.now() - upload.startedAt : 0;
    this.stats.files++;
    this.stats.bytes += size;
    const speed = duration > 0 ? (size * 1000) / duration : 0;
    this.finish(
      id,
      `${theme.success(symbols.success)} ${padEnd(theme.value(truncate(finalName, 40)), 30)} ${padEnd(formatSize(size), 9)} ` +
        theme.dim(`en ${formatDuration(duration)} (${formatSpeed(speed)})  ${symbols.arrow} ${upload?.from ?? '?'}`),
    );
  }

  fail(id: string, reason: string): void {
    const upload = this.active.get(id);
    this.stats.failed++;
    this.finish(id, `${theme.error(symbols.error)} ${theme.value(truncate(upload?.name ?? '?', 40))} ${theme.error(reason)}`);
  }

  refused(message: string): void {
    this.print(`${theme.warn(symbols.warn)} ${theme.warn(message)}`);
  }

  get activeCount(): number {
    return this.active.size;
  }

  stop(): void {
    this.spinner?.stop();
    this.multibar?.stop();
    this.multibar = undefined;
  }

  private finish(id: string, line: string): void {
    const upload = this.active.get(id);
    this.active.delete(id);
    if (upload?.bar && this.multibar) this.multibar.remove(upload.bar);
    if (this.multibar && this.active.size === 0) {
      this.multibar.stop();
      this.multibar = undefined;
    }
    this.print(line);
    if (this.active.size === 0) this.waiting();
  }

  private payload(upload: ActiveUpload): Record<string, string> {
    const elapsed = (Date.now() - upload.startedAt) / 1000;
    const speed = elapsed > 0 ? upload.received / elapsed : 0;
    const remaining = speed > 0 ? ((upload.total - upload.received) / speed) * 1000 : NaN;
    return {
      name: padEnd(truncate(upload.name, nameWidth()), nameWidth()),
      done: formatSize(upload.received),
      size: upload.total > 0 ? formatSize(upload.total) : '?',
      speed: formatSpeed(speed),
      eta: Number.isFinite(remaining) ? `${formatDuration(remaining)} restant` : '…',
    };
  }
}
