const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const releaseDir = path.join(repoRoot, 'releases', 'cli');
const rpmRoot = path.join(releaseDir, 'rpm-build');
const sourcesDir = path.join(rpmRoot, 'SOURCES');
const specsDir = path.join(rpmRoot, 'SPECS');
const tmpDir = path.join(rpmRoot, 'tmp');
const packageDir = path.join(sourcesDir, 'sqlcheck-1.0.0');
const specFile = path.join(specsDir, 'sqlcheck.spec');

fs.rmSync(rpmRoot, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });
fs.mkdirSync(specsDir, { recursive: true });
fs.mkdirSync(path.join(rpmRoot, 'BUILD'), { recursive: true });
fs.mkdirSync(path.join(rpmRoot, 'BUILDROOT'), { recursive: true });
fs.mkdirSync(path.join(rpmRoot, 'RPMS'), { recursive: true });
fs.mkdirSync(path.join(rpmRoot, 'SRPMS'), { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });
fs.copyFileSync(path.join(root, 'dist', 'index.js'), path.join(packageDir, 'sqlcheck'));
fs.copyFileSync(path.join(root, 'dist', 'local-skill.js'), path.join(packageDir, 'local-skill.js'));
fs.cpSync(path.join(root, 'dist', 'core'), path.join(packageDir, 'core'), { recursive: true });
fs.chmodSync(path.join(packageDir, 'sqlcheck'), 0o755);

execFileSync('tar', ['-czf', path.join(sourcesDir, 'sqlcheck-1.0.0.tar.gz'), '-C', sourcesDir, 'sqlcheck-1.0.0'], { stdio: 'inherit' });

fs.writeFileSync(specFile, [
  '%global debug_package %{nil}',
  'Name: sqlcheck',
  'Version: 1.0.0',
  'Release: 1%{?dist}',
  'Summary: CLI local para validar consultas SQL/MongoDB',
  'License: MIT',
  'BuildArch: x86_64',
  'Requires: nodejs >= 18',
  'Source0: %{name}-%{version}.tar.gz',
  '',
  '%description',
  'CLI para consola Linux que valida SQL/MongoDB con el core local empaquetado.',
  '',
  '%prep',
  '%setup -q',
  '',
  '%build',
  '',
  '%install',
  'mkdir -p %{buildroot}/usr/local/bin',
  'mkdir -p %{buildroot}/usr/local/lib/sqlcheck',
  'install -m 0755 sqlcheck %{buildroot}/usr/local/bin/sqlcheck',
  'install -m 0644 local-skill.js %{buildroot}/usr/local/bin/local-skill.js',
  'cp -R core %{buildroot}/usr/local/lib/sqlcheck/core',
  '',
  '%files',
  '/usr/local/bin/sqlcheck',
  '/usr/local/bin/local-skill.js',
  '/usr/local/lib/sqlcheck/core',
  '',
  '%changelog',
  '* Tue Jun 30 2026 SQL/NoSQL Validator <admin@example.com> - 1.0.0-1',
  '- Initial package',
  ''
].join('\n'));

execFileSync(
  'rpmbuild',
  ['--define', `_topdir ${rpmRoot}`, '--define', `_tmppath ${tmpDir}`, '-ba', specFile],
  { stdio: 'inherit', env: { ...process.env, TMPDIR: tmpDir } }
);

const rpmOutDir = path.join(rpmRoot, 'RPMS', 'x86_64');
const rpmFile = fs.readdirSync(rpmOutDir).find(file => file.endsWith('.rpm'));
if (rpmFile) {
  fs.copyFileSync(path.join(rpmOutDir, rpmFile), path.join(releaseDir, 'sqlcheck-1.0.0.x86_64.rpm'));
}

fs.rmSync(rpmRoot, { recursive: true, force: true });
console.log(`Created ${path.join(releaseDir, 'sqlcheck-1.0.0.x86_64.rpm')}`);
