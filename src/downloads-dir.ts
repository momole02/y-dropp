import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Lit XDG_DOWNLOAD_DIR dans ~/.config/user-dirs.dirs (Linux), ce qui donne
 * par exemple ~/Téléchargements sur un système en français.
 */
function readXdgDownloadDir(home: string): string | undefined {
  if (process.env.XDG_DOWNLOAD_DIR) return process.env.XDG_DOWNLOAD_DIR;
  const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  try {
    const content = fs.readFileSync(path.join(configHome, 'user-dirs.dirs'), 'utf8');
    const match = /^\s*XDG_DOWNLOAD_DIR\s*=\s*"?([^"\n]+)"?/m.exec(content);
    if (!match) return undefined;
    const value = match[1].replace(/^\$HOME/, home).replace(/^~/, home);
    return path.isAbsolute(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Dossier de téléchargements de l'utilisateur connecté. */
export function getDefaultDownloadsDir(): string {
  const home = os.homedir();
  if (process.platform === 'linux') {
    const xdg = readXdgDownloadDir(home);
    if (xdg) return xdg;
  }
  return path.join(home, 'Downloads');
}
