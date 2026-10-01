import { clearHistory, readHistory } from '../history';
import { logger } from '../logger';
import { formatDuration, formatSize } from '../utils/size';
import { theme, truncate } from '../ui/theme';
import * as print from '../ui/print';

export interface HistoryOptions {
  limit: string;
  clear?: boolean;
  json?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function historyCommand(opts: HistoryOptions): void {
  if (opts.clear) {
    const count = clearHistory();
    logger().info('history cleared', { count });
    print.success(`Historique vidé (${count} entrée(s) supprimée(s)).`);
    return;
  }
  const limit = Number(opts.limit);
  if (!Number.isInteger(limit) || limit <= 0) throw new Error(`--limit invalide : ${opts.limit}`);
  const entries = readHistory().slice(-limit).reverse();
  if (opts.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  if (entries.length === 0) {
    print.info('Aucun fichier reçu pour le moment.');
    return;
  }
  print.title(`Derniers fichiers reçus (${entries.length})`);
  console.log('');
  print.table(
    ['Date', 'Fichier', 'Taille', 'Durée', 'Depuis', 'Emplacement'],
    entries.map((e) => [
      theme.dim(formatDate(e.date)),
      theme.value(truncate(e.name, 40)),
      formatSize(e.size),
      formatDuration(e.durationMs),
      e.from,
      theme.dim(e.path),
    ]),
  );
}
