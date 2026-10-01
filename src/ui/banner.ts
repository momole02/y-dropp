import boxen from 'boxen';
import qrcode from 'qrcode-terminal';
import { isFancy, padEnd, theme } from './theme';

/** QR code sous forme de texte (demi-blocs, compact). */
export function renderQr(url: string): Promise<string> {
  return new Promise((resolve) => qrcode.generate(url, { small: true }, (qr) => resolve(qr)));
}

export interface BannerInfo {
  addresses: { iface: string; address: string }[];
  port: number;
  url: string;
  otherUrls: string[];
  dir: string;
  pin?: string;
  maxSize?: string;
  once: boolean;
}

export function renderBanner(info: BannerInfo): string {
  const rows: [string, string][] = [
    ['Adresse', theme.value(info.addresses[0]?.address ?? '?') + theme.dim(info.addresses[0] ? `  (${info.addresses[0].iface})` : '')],
    ['Port', theme.value(String(info.port))],
    ['URL', theme.url(info.url)],
  ];
  for (const other of info.otherUrls) rows.push(['', theme.dim(other)]);
  rows.push(['Dossier', info.dir]);
  if (info.pin) rows.push(['Code PIN', theme.pin(info.pin)]);
  if (info.maxSize) rows.push(['Taille max', info.maxSize]);
  if (info.once) rows.push(['Mode', 'arrêt après le premier lot de fichiers']);

  const width = Math.max(...rows.map(([label]) => label.length));
  const body = rows.map(([label, value]) => `${theme.label(padEnd(label, width))}  ${value}`).join('\n');

  if (!isFancy()) return `Y Dropp prêt\n${body}`;
  return boxen(body, {
    title: theme.success('● Y Dropp est prêt'),
    titleAlignment: 'left',
    padding: { top: 1, bottom: 1, left: 2, right: 2 },
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: 'magenta',
  });
}
