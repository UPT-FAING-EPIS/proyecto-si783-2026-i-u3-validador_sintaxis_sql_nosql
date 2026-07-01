const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const releaseDir = path.join(repoRoot, 'releases', 'cli');
const stagingDir = path.join(releaseDir, 'tar-root');
const outFile = path.join(releaseDir, 'sqlcheck-linux.tar.gz');

fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stagingDir, 'sqlcheck', 'bin'), { recursive: true });
fs.mkdirSync(path.join(stagingDir, 'sqlcheck', 'lib'), { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'index.js'), path.join(stagingDir, 'sqlcheck', 'bin', 'sqlcheck'));
fs.cpSync(path.join(root, 'dist', 'core'), path.join(stagingDir, 'sqlcheck', 'lib', 'core'), { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'local-skill.js'), path.join(stagingDir, 'sqlcheck', 'bin', 'local-skill.js'));
fs.chmodSync(path.join(stagingDir, 'sqlcheck', 'bin', 'sqlcheck'), 0o755);
fs.writeFileSync(path.join(stagingDir, 'sqlcheck', 'install.sh'), [
  '#!/usr/bin/env sh',
  'set -eu',
  'install -d /usr/local/bin /usr/local/lib/sqlcheck',
  'install -m 0755 bin/sqlcheck /usr/local/bin/sqlcheck',
  'cp -R lib/core /usr/local/lib/sqlcheck/core',
  'install -m 0644 bin/local-skill.js /usr/local/bin/local-skill.js',
  'echo "sqlcheck instalado. Prueba: sqlcheck --version"',
  ''
].join('\n'));
fs.chmodSync(path.join(stagingDir, 'sqlcheck', 'install.sh'), 0o755);

execFileSync('tar', ['-czf', outFile, '-C', stagingDir, 'sqlcheck'], { stdio: 'inherit' });
fs.rmSync(stagingDir, { recursive: true, force: true });
console.log(`Created ${outFile}`);
