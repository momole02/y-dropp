/**
 * Construit la page d'envoi : compile Tailwind et web/app.ts, puis inline le tout
 * dans une seule page HTML (fonctionne sans accès Internet sur le réseau local).
 * Sorties : build/web/index.html et src/generated/page.ts (importé par le serveur).
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const bin = (name: string) => path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);

function step(label: string, fn: () => void): void {
  const start = Date.now();
  fn();
  console.log(`  ✔ ${label} (${Date.now() - start} ms)`);
}

const tmpDir = path.join(root, 'build', 'web-tmp');
const outDir = path.join(root, 'build', 'web');
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

console.log('Construction de la page web…');

step('Tailwind CSS', () => {
  execFileSync(bin('tailwindcss'), ['-c', 'tailwind.config.js', '-i', 'web/styles.css', '-o', path.join(tmpDir, 'styles.css'), '--minify'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'pipe'],
    shell: process.platform === 'win32',
  });
});

step('TypeScript (web/app.ts)', () => {
  execFileSync(bin('tsc'), ['-p', 'tsconfig.web.json'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
});

step('Assemblage de la page', () => {
  const css = fs.readFileSync(path.join(tmpDir, 'styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(tmpDir, 'app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  const html = fs
    .readFileSync(path.join(root, 'web', 'index.html'), 'utf8')
    .split('/*__CSS__*/').join(css)
    .split('/*__JS__*/').join(js);

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  const generatedDir = path.join(root, 'src', 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(
    path.join(generatedDir, 'page.ts'),
    `// Fichier généré par scripts/build-web.ts — ne pas modifier.\nconst page: string = ${JSON.stringify(html)};\nexport default page;\n`,
  );
  console.log(`    → build/web/index.html (${(Buffer.byteLength(html) / 1024).toFixed(1)} Ko)`);
});
