import {
  CONFIG_DESCRIPTIONS, CONFIG_KEYS, Config, isConfigKey, loadConfig, parseConfigValue, resetConfig, setConfigValue,
} from '../config';
import fs from 'fs';
import { logger } from '../logger';
import { CONFIG_PATH } from '../paths';
import { theme } from '../ui/theme';
import * as print from '../ui/print';

function assertKey(key: string): asserts key is keyof Config {
  if (!isConfigKey(key)) throw new Error(`Clé inconnue : "${key}". Clés disponibles : ${CONFIG_KEYS.join(', ')}`);
}

export function configShowCommand(): void {
  const config = loadConfig();
  print.title('Configuration');
  print.hint(CONFIG_PATH);
  console.log('');
  print.table(
    ['Clé', 'Valeur', 'Description'],
    CONFIG_KEYS.map((key) => [theme.value(key), theme.accent(String(config[key])), theme.dim(CONFIG_DESCRIPTIONS[key])]),
  );
}

export function configGetCommand(key: string): void {
  assertKey(key);
  console.log(String(loadConfig()[key]));
}

export function configSetCommand(key: string, raw: string): void {
  assertKey(key);
  const value = parseConfigValue(key, raw);
  if (key === 'downloadDir') fs.mkdirSync(value as string, { recursive: true });
  setConfigValue(key, value);
  logger().info('config updated', { key, value });
  print.success(`${theme.value(key)} = ${theme.accent(String(value))}`);
}

export function configResetCommand(): void {
  const config = resetConfig();
  logger().info('config reset', { config });
  print.success('Configuration réinitialisée avec les valeurs par défaut.');
}

export function configPathCommand(): void {
  console.log(CONFIG_PATH);
}
