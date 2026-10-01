import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { LOGS_DIR } from '../paths';
import { theme } from '../ui/theme';
import * as print from '../ui/print';

export interface LogsOptions {
  follow?: boolean;
  lines: string;
  path?: boolean;
  raw?: boolean;
}

const LEVEL_STYLE: Record<string, (s: string) => string> = {
  error: (s) => chalk.red.bold(s),
  warn: (s) => chalk.yellow(s),
  info: (s) => chalk.blue(s),
  debug: (s) => chalk.gray(s),
};

function latestLogFile(): string | undefined {
  let files: string[];
  try {
    files = fs.readdirSync(LOGS_DIR).filter((f) => /^ydropp-\d{4}-\d{2}-\d{2}\.log$/.test(f));
  } catch {
    return undefined;
  }
  files.sort();
  const last = files[files.length - 1];
  return last ? path.join(LOGS_DIR, last) : undefined;
}

function formatLine(line: string, raw: boolean): string | undefined {
  if (!line.trim()) return undefined;
  if (raw) return line;
  try {
    const { timestamp, level, message, pid: _pid, ...meta } = JSON.parse(line) as Record<string, unknown>;
    const time = typeof timestamp === 'string' ? new Date(timestamp).toLocaleString('fr-FR') : '';
    const lvl = String(level ?? 'info');
    const style = LEVEL_STYLE[lvl] ?? ((s: string) => s);
    const details = Object.keys(meta).length ? ' ' + theme.dim(JSON.stringify(meta)) : '';
    return `${theme.dim(time)} ${style(lvl.toUpperCase().padEnd(5))} ${message}${details}`;
  } catch {
    return line;
  }
}

export function logsCommand(opts: LogsOptions): void {
  if (opts.path) {
    console.log(LOGS_DIR);
    return;
  }
  const file = latestLogFile();
  if (!file) {
    print.info(`Aucun journal pour le moment (${LOGS_DIR}).`);
    return;
  }
  const count = Number(opts.lines);
  if (!Number.isInteger(count) || count < 0) throw new Error(`--lines invalide : ${opts.lines}`);
  const raw = Boolean(opts.raw);

  const content = fs.readFileSync(file, 'utf8');
  const lines = count === 0 ? [] : content.split('\n').filter(Boolean).slice(-count);
  print.hint(`── ${file}`);
  for (const line of lines) {
    const out = formatLine(line, raw);
    if (out) console.log(out);
  }
  if (!opts.follow) return;

  print.hint('── suivi en temps réel (Ctrl+C pour quitter)');
  let position = Buffer.byteLength(content);
  let buffer = '';
  fs.watchFile(file, { interval: 500 }, (curr) => {
    if (curr.size < position) position = 0; // fichier tronqué ou recréé
    if (curr.size === position) return;
    const stream = fs.createReadStream(file, { start: position, end: curr.size - 1, encoding: 'utf8' });
    position = curr.size;
    stream.on('data', (chunk) => {
      buffer += chunk;
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const out = formatLine(part, raw);
        if (out) console.log(out);
      }
    });
  });
}
