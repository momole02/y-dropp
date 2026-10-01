import os from 'os';

export interface NetworkAddress {
  iface: string;
  address: string;
  /** Adresse dans une plage privée (RFC 1918). */
  private: boolean;
  /** Interface probablement virtuelle (Docker, VM, VPN…). */
  virtual: boolean;
}

const VIRTUAL_IFACE = /^(docker|veth|br-|virbr|vmnet|vboxnet|vethernet|tun|tap|utun|zt|tailscale|wg|lxc|lxd|podman|cni|flannel|kube)/i;
const PHYSICAL_IFACE = /^(wl|wlan|wi-?fi|en|eth|ethernet|wireless)/i;

export function isPrivateIPv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  return a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/** Toutes les adresses IPv4 non internes de la machine. */
export function listIPv4Addresses(): NetworkAddress[] {
  const result: NetworkAddress[] = [];
  const interfaces = os.networkInterfaces();
  for (const [iface, entries] of Object.entries(interfaces)) {
    for (const entry of entries ?? []) {
      // Node 18+ renvoie `family: 4`, Node 14 renvoie "IPv4".
      const family = entry.family as string | number;
      if ((family !== 'IPv4' && family !== 4) || entry.internal) continue;
      result.push({
        iface,
        address: entry.address,
        private: isPrivateIPv4(entry.address),
        virtual: VIRTUAL_IFACE.test(iface),
      });
    }
  }
  return result;
}

function score(addr: NetworkAddress): number {
  let s = 0;
  if (addr.private) s += 100;
  if (!addr.virtual) s += 50;
  if (PHYSICAL_IFACE.test(addr.iface)) s += 20;
  if (addr.address.startsWith('192.168.')) s += 10;
  else if (addr.address.startsWith('10.')) s += 5;
  return s;
}

/** Adresses privées utilisables par le téléphone, la plus probable en premier. */
export function getPrivateAddresses(): NetworkAddress[] {
  return listIPv4Addresses()
    .filter((a) => a.private)
    .sort((a, b) => score(b) - score(a));
}

export function buildUrl(host: string, port: number, pin?: string): string {
  const base = `http://${host}:${port}/`;
  return pin ? `${base}?k=${encodeURIComponent(pin)}` : base;
}
