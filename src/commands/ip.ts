import { getPrivateAddresses, listIPv4Addresses } from '../network';
import { theme } from '../ui/theme';
import * as print from '../ui/print';

export function ipCommand(): void {
  const all = listIPv4Addresses();
  if (all.length === 0) {
    print.warn("Aucune interface réseau IPv4 active. Connectez l'ordinateur à un réseau Wi-Fi ou Ethernet.");
    return;
  }
  const preferred = getPrivateAddresses()[0]?.address;
  print.title('Interfaces réseau');
  console.log('');
  print.table(
    ['Interface', 'Adresse', 'Type', ''],
    all.map((a) => [
      theme.value(a.iface),
      a.address === preferred ? theme.accent(a.address) : a.address,
      [a.private ? 'privée' : theme.dim('publique'), a.virtual ? theme.dim('virtuelle') : ''].filter(Boolean).join(', '),
      a.address === preferred ? theme.success('← utilisée par défaut') : '',
    ]),
  );
  console.log('');
  print.hint('Pour forcer une adresse : ydropp listen --host <adresse>');
}
