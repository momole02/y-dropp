import { loadConfig, parsePort } from '../config';
import { buildUrl, getPrivateAddresses } from '../network';
import { renderQr } from '../ui/banner';
import { theme } from '../ui/theme';
import * as print from '../ui/print';

export interface QrOptions {
  port?: string;
  host?: string;
  pin?: string;
}

export async function qrCommand(opts: QrOptions): Promise<void> {
  const port = parsePort(opts.port ?? loadConfig().port);
  const host = opts.host ?? getPrivateAddresses()[0]?.address;
  if (!host) throw new Error('Aucune adresse IP privée trouvée. Précisez-la avec --host <adresse>.');
  const url = buildUrl(host, port, opts.pin);
  console.log('');
  console.log(`  ${theme.label('URL')}  ${theme.url(url)}`);
  console.log('');
  console.log((await renderQr(url)).replace(/^/gm, '  '));
  print.hint('  Le serveur doit être démarré (ydropp listen) avec le même port pour que le lien fonctionne.');
}
