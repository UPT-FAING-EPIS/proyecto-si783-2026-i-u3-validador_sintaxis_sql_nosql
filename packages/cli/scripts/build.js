const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const src = path.join(root, 'src', 'index.ts');
const localSkill = path.join(root, 'src', 'local-skill.ts');
const distDir = path.join(root, 'dist');
const dist = path.join(distDir, 'index.js');
const coreDir = path.join(distDir, 'core');

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name === 'tests') continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(coreDir, { recursive: true });
fs.copyFileSync(src, dist);
fs.copyFileSync(localSkill, path.join(distDir, 'local-skill.js'));
fs.copyFileSync(path.join(repoRoot, 'src', 'services', 'validation.service.js'), path.join(coreDir, 'validation.service.js'));
copyDir(path.join(repoRoot, 'src', 'services', 'validator'), path.join(coreDir, 'validator'));
fs.chmodSync(dist, 0o755);

console.log(`Built ${path.relative(root, dist)}`);
