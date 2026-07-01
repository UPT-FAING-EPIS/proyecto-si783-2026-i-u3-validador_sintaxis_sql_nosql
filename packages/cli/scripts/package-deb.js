const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const releaseDir = path.join(repoRoot, 'releases', 'cli');
const debRoot = path.join(releaseDir, 'deb-root');
const binDir = path.join(debRoot, 'usr', 'local', 'bin');
const libDir = path.join(debRoot, 'usr', 'local', 'lib', 'sqlcheck');
const controlDir = path.join(debRoot, 'DEBIAN');
const outFile = path.join(releaseDir, 'sqlcheck_1.0.0_amd64.deb');

fs.rmSync(debRoot, { recursive: true, force: true });
fs.mkdirSync(binDir, { recursive: true });
fs.mkdirSync(libDir, { recursive: true });
fs.mkdirSync(controlDir, { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'index.js'), path.join(binDir, 'sqlcheck'));
fs.copyFileSync(path.join(root, 'dist', 'local-skill.js'), path.join(binDir, 'local-skill.js'));
fs.cpSync(path.join(root, 'dist', 'core'), path.join(libDir, 'core'), { recursive: true });
fs.chmodSync(path.join(binDir, 'sqlcheck'), 0o755);

fs.writeFileSync(path.join(controlDir, 'control'), [
  'Package: sqlcheck',
  'Version: 1.0.0',
  'Section: utils',
  'Priority: optional',
  'Architecture: amd64',
  'Depends: nodejs (>= 18)',
  'Maintainer: SQL/NoSQL Validator <admin@example.com>',
  'Description: CLI local para validar consultas SQL/MongoDB sin depender de una API remota.',
  ''
].join('\n'));

execFileSync('dpkg-deb', ['--build', debRoot, outFile], { stdio: 'inherit' });
fs.rmSync(debRoot, { recursive: true, force: true });
console.log(`Created ${outFile}`);
