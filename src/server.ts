import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import { pipeline } from 'stream';
import express, { Request, Response } from 'express';
import pageHtml from './generated/page';
import { errorMeta, logger } from './logger';
import { Storage } from './storage';
import { addHistoryEntry } from './history';
import { UploadMonitor } from './ui/progress';
import { formatSize } from './utils/size';
import { symbols, theme } from './ui/theme';

export interface ServerOptions {
  storage: Storage;
  monitor: UploadMonitor;
  pin?: string;
  maxSize?: number;
  /** Appelé quand le client signale la fin d'un lot (ou après inactivité). */
  onBatchDone?: () => void;
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function clientIp(req: Request): string {
  return (req.socket.remoteAddress ?? '?').replace(/^::ffff:/, '');
}

function describeDevice(userAgent: string): string {
  const os =
    /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Android/.test(userAgent) ? 'Android'
    : /Windows/.test(userAgent) ? 'Windows'
    : /Mac OS X/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : '';
  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /Firefox|FxiOS/.test(userAgent) ? 'Firefox'
    : /Chrome|CriOS/.test(userAgent) ? 'Chrome'
    : /Safari/.test(userAgent) ? 'Safari'
    : /curl/i.test(userAgent) ? 'curl'
    : '';
  return [os, browser].filter(Boolean).join(' · ') || 'appareil inconnu';
}

function safeEqual(a: string, b: string): boolean {
  const ba = new Uint8Array(Buffer.from(a));
  const bb = new Uint8Array(Buffer.from(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function createApp(options: ServerOptions): express.Express {
  const { storage, monitor, pin, maxSize } = options;
  const app = express();
  app.disable('x-powered-by');
  const seenClients = new Set<string>();
  let idleTimer: NodeJS.Timeout | undefined;

  const scheduleIdleBatchEnd = () => {
    if (!options.onBatchDone) return;
    if (idleTimer) clearTimeout(idleTimer);
    // Filet de sécurité pour --once quand le client (ex. curl) ne signale pas la fin du lot.
    idleTimer = setTimeout(() => {
      if (monitor.activeCount === 0 && monitor.stats.files > 0) options.onBatchDone?.();
    }, 5000);
  };

  const page = pageHtml.split('__YDROPP_CONFIG__').join(
    JSON.stringify({ pinRequired: Boolean(pin), maxSize: maxSize ?? null, hostname: os.hostname() }).replace(/</g, '\\u003c'),
  );

  const checkPin = (req: Request) => {
    if (!pin) return;
    const provided = String(req.get('x-ydropp-key') ?? req.query.k ?? '');
    if (!safeEqual(provided, pin)) throw new HttpError(403, 'Code PIN invalide');
  };

  app.get('/', (req, res) => {
    const ip = clientIp(req);
    if (!seenClients.has(ip)) {
      seenClients.add(ip);
      const ua = req.get('user-agent') ?? '';
      logger().info('client connected', { ip, userAgent: ua });
      monitor.print(`${theme.info(symbols.bullet)} Appareil connecté : ${theme.value(ip)} ${theme.dim(`(${describeDevice(ua)})`)}`);
    }
    res.set('Cache-Control', 'no-store').type('html').send(page);
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/batch-done', (req, res) => {
    try {
      checkPin(req);
    } catch {
      res.status(403).end();
      return;
    }
    res.status(204).end();
    logger().debug('batch done signaled', { ip: clientIp(req) });
    if (monitor.activeCount === 0 && monitor.stats.files > 0) options.onBatchDone?.();
  });

  app.put('/upload', (req, res) => {
    handleUpload(req, res).catch((err) => {
      logger().error('unexpected upload error', { error: errorMeta(err) });
      if (!res.headersSent) res.status(500).json({ error: 'Erreur interne' });
    });
  });

  async function handleUpload(req: Request, res: Response): Promise<void> {
    const ip = clientIp(req);
    let filename: string;
    let expected: number | undefined;
    try {
      checkPin(req);
      const header = req.get('x-filename');
      if (!header) throw new HttpError(400, 'En-tête X-Filename manquant');
      try {
        filename = decodeURIComponent(header);
      } catch {
        throw new HttpError(400, 'En-tête X-Filename mal encodé');
      }
      const lengthHeader = req.get('content-length');
      expected = lengthHeader !== undefined ? Number(lengthHeader) : undefined;
      if (expected !== undefined && (!Number.isFinite(expected) || expected < 0)) {
        throw new HttpError(400, 'Content-Length invalide');
      }
      if (maxSize !== undefined && expected !== undefined && expected > maxSize) {
        throw new HttpError(413, `Fichier trop volumineux (${formatSize(expected)} > ${formatSize(maxSize)})`);
      }
    } catch (err) {
      const e = err as HttpError;
      logger().warn('upload refused', { ip, status: e.status, reason: e.message, filename: req.get('x-filename') });
      monitor.refused(`Refusé (${e.status}) : ${e.message} ${symbols.arrow} ${ip}`);
      res.status(e.status).set('Connection', 'close').json({ error: e.message });
      req.resume();
      return;
    }

    await storage.ensure();
    const id = crypto.randomBytes(6).toString('hex');
    const tempPath = storage.createTempPath();
    const startedAt = Date.now();
    let received = 0;
    let tooLarge = false;

    logger().info('upload started', { id, ip, filename, size: expected });
    monitor.start(id, filename, expected ?? 0, ip);

    const output = fs.createWriteStream(tempPath);
    req.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (maxSize !== undefined && received > maxSize && !tooLarge) {
        // Taille inconnue à l'avance (envoi chunked) : on répond tout de suite puis on coupe la connexion.
        tooLarge = true;
        req.unpipe(output);
        output.destroy(new HttpError(413, 'Fichier trop volumineux'));
        res.status(413).set('Connection', 'close').json({ error: `Fichier trop volumineux (max ${formatSize(maxSize)})` });
        res.once('finish', () => req.socket.destroy());
        return;
      }
      monitor.progress(id, received);
    });

    pipeline(req, output, async (err) => {
      const durationMs = Date.now() - startedAt;
      if (!err && expected !== undefined && received !== expected) {
        err = new HttpError(400, `Transfert incomplet (${received}/${expected} octets)`);
      }
      if (err) {
        await storage.discard(tempPath);
        const aborted = (err as NodeJS.ErrnoException).code === 'ERR_STREAM_PREMATURE_CLOSE' || req.aborted;
        const reason = tooLarge ? 'Fichier trop volumineux' : aborted ? 'Annulé / connexion interrompue' : err.message;
        logger().warn('upload failed', { id, ip, filename, received, durationMs, reason });
        monitor.fail(id, reason);
        if (!res.headersSent && !aborted) {
          res.status(err instanceof HttpError ? err.status : 500).set('Connection', 'close').json({ error: reason });
        }
        return;
      }
      try {
        const finalPath = await storage.finalize(tempPath, filename);
        const finalName = finalPath.slice(storage.targetDir.length + 1);
        logger().info('upload completed', {
          id, ip, filename, savedAs: finalPath, size: received, durationMs,
          bytesPerSecond: durationMs > 0 ? Math.round((received * 1000) / durationMs) : null,
        });
        try {
          addHistoryEntry({ name: finalName, path: finalPath, size: received, date: new Date().toISOString(), durationMs, from: ip });
        } catch (historyErr) {
          logger().warn('history write failed', { error: errorMeta(historyErr) });
        }
        monitor.complete(id, finalName, received);
        res.status(201).json({ name: finalName, size: received });
        scheduleIdleBatchEnd();
      } catch (moveErr) {
        await storage.discard(tempPath);
        logger().error('could not move uploaded file', { id, filename, error: errorMeta(moveErr) });
        monitor.fail(id, `Impossible d'enregistrer le fichier : ${(moveErr as Error).message}`);
        if (!res.headersSent) res.status(500).json({ error: "Impossible d'enregistrer le fichier" });
      }
    });
  }

  return app;
}
