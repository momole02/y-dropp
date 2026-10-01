/**
 * Compile build/ydropp.js en exécutables autonomes avec nexe.
 * Usage : ts-node scripts/dist.ts [linux|windows|mac ...]   (toutes les cibles par défaut)
 *
 * Les binaires Node précompilés (14.15.3) sont téléchargés par nexe et mis en cache
 * dans ~/.nexe : aucune compilation de Node n'est nécessaire.
 */
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compile } = require('nexe') as { compile: (options: Record<string, unknown>) => Promise<void> };

const NODE_VERSION = '14.15.3';

const TARGETS: Record<string, { target: string; output: string }> = {
  linux: { target: `linux-x64-${NODE_VERSION}`, output: 'ydropp-linux' },
  windows: { target: `windows-x64-${NODE_VERSION}`, output: 'ydropp-win.exe' },
  mac: { target: `mac-x64-${NODE_VERSION}`, output: 'ydropp-macos' },
};

async function main(): Promise<void> {
  const root = path.resolve(__dirname, '..');
  const input = path.join(root, 'build', 'ydropp.js');
  if (!fs.existsSync(input)) throw new Error('build/ydropp.js introuvable : lancez "npm run build" d’abord.');

  const requested = process.argv.slice(2);
  const names = requested.length ? requested : Object.keys(TARGETS);
  for (const name of names) {
    if (!TARGETS[name]) throw new Error(`Cible inconnue : ${name} (valeurs : ${Object.keys(TARGETS).join(', ')})`);
  }

  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  for (const name of names) {
    const { target, output } = TARGETS[name];
    const outPath = path.join(root, 'dist', output);
    console.log(`\n→ ${name} (${target})`);
    await compile({
      input,
      output: outPath,
      targets: [target],
      cwd: root,
      loglevel: 'info',
    });
    if (name !== 'windows') fs.chmodSync(outPath, 0o755);
    const size = fs.statSync(outPath).size / 1024 / 1024;
    console.log(`  ✔ dist/${output} (${size.toFixed(1)} Mo)`);
  }
}

main().catch((err) => {
  console.error(`✖ ${(err as Error).message}`);
  process.exit(1);
});
