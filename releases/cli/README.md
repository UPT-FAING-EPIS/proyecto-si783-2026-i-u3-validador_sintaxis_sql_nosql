# Releases CLI Linux local

Los artefactos generados por `packages/cli` se escriben aqui. Estos paquetes instalan `sqlcheck` con el core local de validacion y no requieren API remota.

- `sqlcheck-linux.tar.gz`
- `sqlcheck_1.0.0_amd64.deb`
- `sqlcheck-1.0.0.x86_64.rpm`

Generar desde la raiz del paquete:

```bash
cd packages/cli
npm run package:tar
npm run package:deb
npm run package:rpm
```

Instalacion rapida:

```bash
sudo dpkg -i sqlcheck_1.0.0_amd64.deb
# o
sudo dnf install ./sqlcheck-1.0.0.x86_64.rpm
```

En Fedora/RHEL/CentOS usa `dnf install ./archivo.rpm`; `rpm -i` no instala dependencias como `nodejs`.
