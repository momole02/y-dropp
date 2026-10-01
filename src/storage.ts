import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { TEMP_DIR_NAME, TEMP_EXTENSION } from './paths';

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

/** Rend un nom de fichier envoyé par le client sûr pour tous les OS. */
export function sanitizeFilename(raw: string): string {
  let name = raw.replace(/\\/g, '/');
  name = name.slice(name.lastIndexOf('/') + 1);
  name = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '_')
    .replace(/^[\s.]+/, '')
    .replace(/[\s.]+$/, '')
    .trim();
  if (WINDOWS_RESERVED.test(name)) name = `_${name}`;
  if (Buffer.byteLength(name) > 240) {
    const ext = path.extname(name).slice(0, 20);
    let base = name.slice(0, name.length - ext.length);
    while (Buffer.byteLength(base + ext) > 240) base = base.slice(0, -1);
    name = base + ext;
  }
  return name || `fichier-${Date.now()}`;
}

export class Storage {
  readonly tempDir: string;

  constructor(readonly targetDir: string) {
    this.tempDir = path.join(targetDir, TEMP_DIR_NAME);
  }

  async ensure(): Promise<void> {
    await fs.promises.mkdir(this.targetDir, { recursive: true });
    await fs.promises.mkdir(this.tempDir, { recursive: true });
  }

  /** Chemin d'un nouveau fichier temporaire (même système de fichiers que la destination → rename atomique). */
  createTempPath(): string {
    return path.join(this.tempDir, `${crypto.randomBytes(12).toString('hex')}${TEMP_EXTENSION}`);
  }

  /**
   * Déplace le fichier temporaire vers le dossier de destination sous un nom libre
   * ("photo.jpg", puis "photo (1).jpg", …). Le nom est réservé avec un open exclusif
   * pour éviter les collisions entre uploads simultanés.
   */
  async finalize(tempPath: string, filename: string): Promise<string> {
    const name = sanitizeFilename(filename);
    const ext = path.extname(name);
    const base = name.slice(0, name.length - ext.length);
    for (let i = 0; i < 10000; i++) {
      const candidate = path.join(this.targetDir, i === 0 ? name : `${base} (${i})${ext}`);
      try {
        const handle = await fs.promises.open(candidate, 'wx');
        await handle.close();
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') continue;
        throw err;
      }
      try {
        await fs.promises.rename(tempPath, candidate);
      } catch (err) {
        await fs.promises.unlink(candidate).catch(() => undefined);
        throw err;
      }
      return candidate;
    }
    throw new Error(`Impossible de trouver un nom libre pour ${name}`);
  }

  async discard(tempPath: string): Promise<void> {
    await fs.promises.unlink(tempPath).catch(() => undefined);
  }

  /** Supprime les fichiers .part restants. Renvoie le nombre et le volume supprimés. */
  async cleanTemp(): Promise<{ count: number; bytes: number }> {
    let entries: string[];
    try {
      entries = await fs.promises.readdir(this.tempDir);
    } catch {
      return { count: 0, bytes: 0 };
    }
    let count = 0;
    let bytes = 0;
    for (const entry of entries) {
      if (!entry.endsWith(TEMP_EXTENSION)) continue;
      const file = path.join(this.tempDir, entry);
      try {
        const stat = await fs.promises.stat(file);
        await fs.promises.unlink(file);
        count++;
        bytes += stat.size;
      } catch {
        // fichier déjà supprimé ou verrouillé : on ignore
      }
    }
    await fs.promises.rmdir(this.tempDir).catch(() => undefined);
    return { count, bytes };
  }
}
