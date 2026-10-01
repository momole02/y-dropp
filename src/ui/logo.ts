import gradient from 'gradient-string';
import { isFancy, theme } from './theme';

const ART = String.raw`
 __   __  ____
 \ \ / / |  _ \  _ __  ___   _ __   _ __
  \ V /  | | | || '__|/ _ \ | '_ \ | '_ \
   | |   | |_| || |  | (_) || |_) || |_) |
   |_|   |____/ |_|   \___/ | .__/ | .__/
                            |_|    |_|`;

export function renderLogo(version: string): string {
  const tagline = `  Transfert de fichiers téléphone → ordinateur  ·  v${version}`;
  if (!isFancy()) return `Y Dropp v${version}`;
  return `${gradient(['#22d3ee', '#a78bfa', '#f472b6']).multiline(ART)}\n${theme.dim(tagline)}`;
}
