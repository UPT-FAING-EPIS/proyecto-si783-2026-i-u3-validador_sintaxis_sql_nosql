# Uso del CLI Linux local

El CLI vive en `packages/cli` y publica el comando `sqlcheck`.

Esta herramienta esta orientada principalmente a Linux y valida consultas desde consola usando el core local empaquetado. No necesita API remota, URL, token ni red.

## Comandos

```bash
sqlcheck validate "SELECT * FORM usuarios;"
sqlcheck validate consulta.sql
sqlcheck validate consulta.sql --engine mysql
sqlcheck diagnostic "CREATE TABL empleados (id INT);"
sqlcheck fix "CREATE TABL empleados (id INT);"
sqlcheck lint consulta.sql
sqlcheck format consulta.sql
cat consulta.sql | sqlcheck validate --stdin
```

## JSON completo

```bash
sqlcheck validate consulta.sql --json
```

## Salida amigable

Si la consulta es invalida, el CLI muestra:

- motor solicitado
- motor detectado
- linea
- columna
- token
- mensaje
- sugerencia
- severidad

## Codigos de salida

- `0`: consulta valida o comando ejecutado correctamente.
- `1`: consulta invalida, diagnosticos o advertencias.
- `2`: error interno del CLI o comando invalido.

## Build local

```bash
cd packages/cli
npm install
npm run build
node dist/index.js validate "SELECT * FROM empleados;"
node dist/index.js validate "SELECT * FORM empleados;"
```

## Paquetes

```bash
npm run package:tar
npm run package:deb
npm run package:rpm
```

Los artefactos quedan en `releases/cli`.

## Instalacion

Debian/Ubuntu:

```bash
sudo dpkg -i sqlcheck_1.0.0_amd64.deb
sqlcheck --version
```

Fedora/RHEL/CentOS:

```bash
sudo dnf install ./sqlcheck-1.0.0.x86_64.rpm
sqlcheck --version
```

En Fedora/RHEL/CentOS se recomienda `dnf install ./archivo.rpm`, no `rpm -i`, porque `dnf` instala dependencias como `nodejs`. Node instalado con `nvm` no cuenta para RPM, ya que el paquete necesita `/usr/bin/node`.

Tarball:

```bash
tar -xzf sqlcheck-linux.tar.gz
cd sqlcheck
sudo ./install.sh
sqlcheck --version
```
