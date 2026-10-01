const UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'];

const MULTIPLIERS: Record<string, number> = {
  '': 1,
  b: 1,
  o: 1,
  k: 1024,
  ko: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mo: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  go: 1024 ** 3,
  gb: 1024 ** 3,
  t: 1024 ** 4,
  to: 1024 ** 4,
  tb: 1024 ** 4,
};

/** Convertit une taille lisible ("4G", "500Mo", "1.5gb", "1024") en octets. */
export function parseSize(input: string): number {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\s*$/.exec(input);
  if (!match) throw new Error(`Taille invalide : "${input}" (exemples : 500M, 4G, 1.5Go)`);
  const value = parseFloat(match[1].replace(',', '.'));
  const multiplier = MULTIPLIERS[match[2].toLowerCase()];
  if (multiplier === undefined) throw new Error(`Unité inconnue : "${match[2]}" (utilisez K, M, G ou T)`);
  return Math.round(value * multiplier);
}

/** Formate un nombre d'octets ("3,2 Mo"). */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '?';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits).replace('.', ',')} ${UNITS[unit]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatSize(bytesPerSecond)}/s`;
}

/** Formate une durée en millisecondes ("850 ms", "1,4 s", "2 min 05 s"). */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '?';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1).replace('.', ',')} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes} min ${String(rest).padStart(2, '0')} s`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${String(minutes % 60).padStart(2, '0')} min`;
}
