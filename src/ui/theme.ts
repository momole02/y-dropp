import chalk from 'chalk';

let fancy = Boolean(process.stdout.isTTY);

/**
 * Active ou non les couleurs et animations. Elles sont coupées si la sortie
 * n'est pas un terminal, si NO_COLOR est défini ou avec --no-color.
 */
export function configureOutput(options: { color: boolean }): void {
  const enabled = options.color && !('NO_COLOR' in process.env) && Boolean(process.stdout.isTTY);
  const forced = process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== '0';
  if (enabled || (options.color && forced)) {
    chalk.level = chalk.supportsColor ? chalk.supportsColor.level : 1;
  } else {
    chalk.level = 0;
  }
  fancy = enabled;
}

/** Vrai si l'on peut utiliser couleurs, spinners et barres de progression. */
export function isFancy(): boolean {
  return fancy;
}

export const theme = {
  accent: (s: string) => chalk.hex('#a78bfa')(s),
  url: (s: string) => chalk.cyan.underline(s),
  label: (s: string) => chalk.gray(s),
  value: (s: string) => chalk.bold(s),
  dim: (s: string) => chalk.dim(s),
  success: (s: string) => chalk.green(s),
  error: (s: string) => chalk.red(s),
  warn: (s: string) => chalk.yellow(s),
  info: (s: string) => chalk.blue(s),
  pin: (s: string) => chalk.bgMagenta.white.bold(` ${s} `),
};

export const symbols = {
  get success() {
    return fancy ? '✔' : '[ok]';
  },
  get error() {
    return fancy ? '✖' : '[erreur]';
  },
  get warn() {
    return fancy ? '⚠' : '[attention]';
  },
  get info() {
    return fancy ? 'ℹ' : '[info]';
  },
  get arrow() {
    return fancy ? '←' : '<-';
  },
  get bullet() {
    return fancy ? '●' : '*';
  },
};

const ANSI = /\u001b\[[0-9;]*m/g;

export function stripAnsi(s: string): string {
  return s.replace(ANSI, '');
}

export function visibleWidth(s: string): number {
  return Array.from(stripAnsi(s)).length;
}

export function truncate(s: string, max: number): string {
  const chars = Array.from(s);
  if (chars.length <= max) return s;
  return chars.slice(0, Math.max(1, max - 1)).join('') + '…';
}

export function padEnd(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - visibleWidth(s)));
}
