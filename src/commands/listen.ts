import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import net from 'net';
import path from 'path';
import ora from 'ora';
import { expandHome, loadConfig, parsePort } from '../config';
import { closeLogger, errorMeta, logger } from '../logger';
import { buildUrl, getPrivateAddresses, listIPv4Addresses } from '../network';
import { createApp } from '../server';
import { Storage } from '../storage';
import { renderBanner, renderQr } from '../ui/banner';
import { renderLogo } from '../ui/logo';
import { UploadMonitor } from '../ui/progress';
import { isFancy, theme } from '../ui/theme';
import * as print from '../ui/print';
import { formatDuration, formatSize, parseSize } from '../utils/size';
import { VERSION } from '../version';

export interface ListenOptions {
  port?: string;
  dir?: string;
  host?: string;
  pin?: boolean;
  once?: boolean;
  maxSize?: string;
  qr: boolean;
}

function generatePin(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function listenCommand(opts: ListenOptions): Promise<void> {
  const config = loadConfig();
  const port = parsePort(opts.port ?? config.port);
  const dir = path.resolve(expandHome(opts.dir ?? config.downloadDir));
  const maxSize = opts.maxSize !== undefined ? parseSize(opts.maxSize) : undefined;
  const pin = (opts.pin ?? config.pin) ? generatePin() : undefined;

  let bindHost = '0.0.0.0';
  let addresses = getPrivateAddresses();
  if (opts.host) {
    if (!net.isIPv4(opts.host)) throw new Error(`Adresse IPv4 invalide : ${opts.host}`);
    const match = listIPv4Addresses().find((a) => a.address === opts.host);
    if (!match) throw new Error(`L'adresse ${opts.host} n'appartient à aucune interface de cette machine (voir "ydropp ip").`);
    bindHost = opts.host;
    addresses = [match];
  }

  const storage = new Storage(dir);
  try {
    await storage.ensure();
    await fs.promises.access(dir, fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Le dossier de destination ${dir} n'est pas accessible en écriture : ${(err as Error).message}`);
  }

  const spinner = isFancy() ? ora({ text: 'Démarrage du serveur…', color: 'magenta' }).start() : undefined;
  const monitor = new UploadMonitor();
  const sockets = new Set<net.Socket>();
  let shuttingDown = false;

  const shutdown = async (reason: string, code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    monitor.stop();
    server.close();
    for (const socket of sockets) socket.destroy();
    const cleaned = await storage.cleanTemp();
    const { files, bytes, failed, startedAt } = monitor.stats;
    logger().info('server stopped', { reason, files, bytes, failed, cleanedTempFiles: cleaned.count });
    console.log('');
    print.title('Récapitulatif de la session');
    console.log(
      `  ${theme.label('Fichiers reçus')}  ${theme.value(String(files))}   ` +
        `${theme.label('Volume')}  ${theme.value(formatSize(bytes))}   ` +
        `${theme.label('Échecs')}  ${failed ? theme.error(String(failed)) : theme.value('0')}   ` +
        `${theme.label('Durée')}  ${theme.value(formatDuration(Date.now() - startedAt))}`,
    );
    if (cleaned.count) print.hint(`  ${cleaned.count} fichier(s) partiel(s) supprimé(s).`);
    print.success('Serveur arrêté.');
    await closeLogger();
    process.exit(code);
  };

  const app = createApp({
    storage,
    monitor,
    pin,
    maxSize,
    onBatchDone: opts.once ? () => void shutdown('once') : undefined,
  });
  const server = http.createServer(app);
  // Pas de délai d'expiration : les gros fichiers peuvent prendre longtemps.
  server.timeout = 0;
  server.keepAliveTimeout = 10_000;
  (server as http.Server & { requestTimeout?: number }).requestTimeout = 0;
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', (err: NodeJS.ErrnoException) => {
      spinner?.stop();
      if (err.code === 'EADDRINUSE') reject(new Error(`Le port ${port} est déjà utilisé. Essayez --port=<autre> ou --port=0 (port libre).`));
      else if (err.code === 'EACCES') reject(new Error(`Permission refusée pour le port ${port}. Utilisez un port supérieur à 1024.`));
      else reject(err);
    });
    server.listen(port, bindHost, () => resolve());
  });
  server.on('error', (err) => logger().error('server error', { error: errorMeta(err) }));

  const actualPort = (server.address() as net.AddressInfo).port;
  const mainHost = addresses[0]?.address ?? '127.0.0.1';
  const url = buildUrl(mainHost, actualPort, pin);
  spinner?.succeed(`Serveur démarré sur le port ${actualPort}`);

  logger().info('server started', { version: VERSION, port: actualPort, bindHost, addresses, dir, pin: Boolean(pin), maxSize, once: Boolean(opts.once) });

  console.log(renderLogo(VERSION));
  console.log(
    renderBanner({
      addresses,
      port: actualPort,
      url,
      otherUrls: addresses
        .slice(1)
        .filter((a) => !a.virtual)
        .map((a) => `${buildUrl(a.address, actualPort, pin)}  (${a.iface})`),
      dir,
      pin,
      maxSize: maxSize !== undefined ? formatSize(maxSize) : undefined,
      once: Boolean(opts.once),
    }),
  );
  if (addresses.length === 0) {
    print.warn("Aucune adresse IP privée trouvée : êtes-vous connecté à un réseau Wi-Fi/Ethernet ?");
  }
  if (opts.qr) {
    console.log('');
    console.log(theme.dim('  Scannez ce QR code avec votre téléphone :'));
    const qr = await renderQr(url);
    console.log(qr.replace(/^/gm, '  '));
  } else {
    console.log('');
  }

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  monitor.waiting();
}
