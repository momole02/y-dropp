import path from 'path';
import ora from 'ora';
import { expandHome, loadConfig } from '../config';
import { logger } from '../logger';
import { Storage } from '../storage';
import { formatSize } from '../utils/size';
import { isFancy } from '../ui/theme';
import * as print from '../ui/print';

export async function cleanCommand(opts: { dir?: string }): Promise<void> {
  const dir = path.resolve(expandHome(opts.dir ?? loadConfig().downloadDir));
  const storage = new Storage(dir);
  const spinner = isFancy() ? ora({ text: `Recherche de fichiers partiels dans ${storage.tempDir}…`, color: 'magenta' }).start() : undefined;
  const { count, bytes } = await storage.cleanTemp();
  logger().info('temp cleaned', { dir: storage.tempDir, count, bytes });
  const message = count
    ? `${count} fichier(s) partiel(s) supprimé(s), ${formatSize(bytes)} libéré(s).`
    : 'Aucun fichier partiel à supprimer.';
  if (spinner) spinner.succeed(message);
  else print.success(message);
}
