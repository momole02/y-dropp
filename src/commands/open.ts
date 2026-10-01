import { spawn } from 'child_process';
import fs from 'fs';
import { loadConfig } from '../config';
import * as print from '../ui/print';
import { theme } from '../ui/theme';

function opener(): { cmd: string; args: string[] } {
  switch (process.platform) {
    case 'win32':
      return { cmd: 'explorer.exe', args: [] };
    case 'darwin':
      return { cmd: 'open', args: [] };
    default:
      return { cmd: 'xdg-open', args: [] };
  }
}

export async function openCommand(): Promise<void> {
  const dir = loadConfig().downloadDir;
  await fs.promises.mkdir(dir, { recursive: true });
  const { cmd, args } = opener();
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, [...args, dir], { detached: true, stdio: 'ignore' });
    child.once('error', (err) => reject(new Error(`Impossible d'ouvrir le dossier (${cmd}) : ${err.message}`)));
    // L'événement 'spawn' n'existe pas sous Node 14 : on laisse un court délai à une éventuelle erreur.
    setTimeout(() => {
      child.unref();
      resolve();
    }, 200);
  });
  print.success(`Ouverture de ${theme.value(dir)}`);
}
