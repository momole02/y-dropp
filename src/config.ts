import fs from 'fs';
import os from 'os';
import path from 'path';
import { CONFIG_PATH, YDROPP_HOME } from './paths';
import { getDefaultDownloadsDir } from './downloads-dir';

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

export interface Config {
  /** Dossier où sont déplacés les fichiers reçus. */
  downloadDir: string;
  /** Port par défaut de `ydropp listen`. */
  port: number;
  /** Exiger un code PIN par défaut. */
  pin: boolean;
  /** Niveau de détail du journal. */
  logLevel: LogLevel;
}

export type ConfigKey = keyof Config;
export const CONFIG_KEYS: ConfigKey[] = ['downloadDir', 'port', 'pin', 'logLevel'];

export const CONFIG_DESCRIPTIONS: Record<ConfigKey, string> = {
  downloadDir: 'Dossier de destination des fichiers reçus',
  port: 'Port par défaut du serveur',
  pin: 'Exiger un code PIN par défaut (true/false)',
  logLevel: `Niveau de journalisation (${LOG_LEVELS.join(', ')})`,
};

export function defaultConfig(): Config {
  return {
    downloadDir: getDefaultDownloadsDir(),
    port: 8080,
    pin: false,
    logLevel: 'info',
  };
}

export function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2));
  return p;
}

export function parsePort(raw: string | number): number {
  const port = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Port invalide : "${raw}" (entier entre 0 et 65535 attendu)`);
  }
  return port;
}

function parseBoolean(raw: string): boolean {
  const value = raw.trim().toLowerCase();
  if (['true', '1', 'yes', 'oui', 'on'].includes(value)) return true;
  if (['false', '0', 'no', 'non', 'off'].includes(value)) return false;
  throw new Error(`Booléen invalide : "${raw}" (true ou false attendu)`);
}

function parseLogLevel(raw: string): LogLevel {
  const value = raw.trim().toLowerCase() as LogLevel;
  if (!LOG_LEVELS.includes(value)) {
    throw new Error(`Niveau invalide : "${raw}" (valeurs possibles : ${LOG_LEVELS.join(', ')})`);
  }
  return value;
}

export function isConfigKey(key: string): key is ConfigKey {
  return (CONFIG_KEYS as string[]).includes(key);
}

/** Valide et convertit une valeur saisie en ligne de commande. */
export function parseConfigValue<K extends ConfigKey>(key: K, raw: string): Config[K] {
  switch (key) {
    case 'downloadDir':
      return path.resolve(expandHome(raw.trim())) as Config[K];
    case 'port':
      return parsePort(raw) as Config[K];
    case 'pin':
      return parseBoolean(raw) as Config[K];
    case 'logLevel':
      return parseLogLevel(raw) as Config[K];
    default:
      throw new Error(`Clé inconnue : ${key}`);
  }
}

/** Ne garde que les valeurs valides du fichier, les autres reprennent leur valeur par défaut. */
function sanitize(raw: unknown): Config {
  const config = defaultConfig();
  if (!raw || typeof raw !== 'object') return config;
  const data = raw as Record<string, unknown>;
  if (typeof data.downloadDir === 'string' && data.downloadDir.trim()) {
    config.downloadDir = path.resolve(expandHome(data.downloadDir.trim()));
  }
  if (typeof data.port === 'number' && Number.isInteger(data.port) && data.port >= 0 && data.port <= 65535) {
    config.port = data.port;
  }
  if (typeof data.pin === 'boolean') config.pin = data.pin;
  if (typeof data.logLevel === 'string' && (LOG_LEVELS as readonly string[]).includes(data.logLevel)) {
    config.logLevel = data.logLevel as LogLevel;
  }
  return config;
}

export function saveConfig(config: Config): void {
  fs.mkdirSync(YDROPP_HOME, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/** Charge la configuration ; crée le fichier avec les valeurs par défaut s'il n'existe pas. */
export function loadConfig(): Config {
  let content: string;
  try {
    content = fs.readFileSync(CONFIG_PATH, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    const config = defaultConfig();
    saveConfig(config);
    return config;
  }
  try {
    return sanitize(JSON.parse(content));
  } catch {
    throw new Error(`Le fichier de configuration ${CONFIG_PATH} n'est pas un JSON valide. Corrigez-le ou lancez "ydropp config reset".`);
  }
}

export function setConfigValue<K extends ConfigKey>(key: K, value: Config[K]): Config {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
  return config;
}

export function resetConfig(): Config {
  const config = defaultConfig();
  saveConfig(config);
  return config;
}
