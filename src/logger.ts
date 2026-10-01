import fs from 'fs';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOGS_DIR } from './paths';
import type { LogLevel } from './config';

let instance: winston.Logger | undefined;
let currentLevel: LogLevel = 'info';

function create(): winston.Logger {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  return winston.createLogger({
    level: currentLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { pid: process.pid },
    transports: [
      new DailyRotateFile({
        dirname: LOGS_DIR,
        filename: 'ydropp-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        auditFile: `${LOGS_DIR}/.audit.json`,
      }),
    ],
  });
}

/**
 * Journal fichier (JSON, sans couleurs) dans $HOME/.ydropp/logs.
 * Créé à la première utilisation pour ne pas toucher au disque inutilement.
 */
export function logger(): winston.Logger {
  if (!instance) instance = create();
  return instance;
}

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
  if (instance) instance.level = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

/** Vide les tampons du journal avant de quitter le processus. */
export function closeLogger(): Promise<void> {
  const log = instance;
  if (!log) return Promise.resolve();
  instance = undefined;
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, 1000);
    log.on('finish', () => {
      clearTimeout(timer);
      // Laisse le temps au transport fichier de terminer l'écriture.
      setTimeout(resolve, 50);
    });
    log.end();
  });
}

/** Rend une erreur sérialisable dans le journal JSON (winston n'exporte pas les Error imbriquées). */
export function errorMeta(err: unknown): { message: string; code?: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, code: (err as NodeJS.ErrnoException).code, stack: err.stack };
  }
  return { message: String(err) };
}
