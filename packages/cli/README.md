# sqlcheck CLI Linux local

`sqlcheck` valida consultas SQL/MongoDB desde consola usando el core local empaquetado. No requiere API remota, red ni configuracion de URL.

El API publica de la Skill puede seguir desplegada para integraciones HTTP, pero el CLI instalado en Linux funciona dentro del entorno donde se instala.

## Desarrollo

```bash
cd packages/cli
npm install
npm run build
node dist/index.js validate "SELECT * FROM empleados;"
node dist/index.js validate "SELECT * FORM empleados;"
```

## Uso

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

Para ver la respuesta completa del validador local:

```bash
sqlcheck validate consulta.sql --json
```

## Codigos de salida

- `0`: consulta valida o comando ejecutado correctamente.
- `1`: consulta invalida, diagnosticos o advertencias.
- `2`: error interno del CLI o comando invalido.

## Paquetes Linux

Generar artefactos en `releases/cli`:

```bash
npm run package:tar
npm run package:deb
npm run package:rpm
```

Instalar `.tar.gz`:

```bash
tar -xzf sqlcheck-linux.tar.gz
cd sqlcheck
sudo ./install.sh
sqlcheck --version
```

Instalar Debian/Ubuntu:

```bash
sudo dpkg -i sqlcheck_1.0.0_amd64.deb
sqlcheck --version
```

Instalar Fedora/RHEL/CentOS:

```bash
sudo dnf install ./sqlcheck-1.0.0.x86_64.rpm
sqlcheck --version
```

Usa `dnf install ./archivo.rpm` en vez de `rpm -i` para que Fedora/RHEL/CentOS resuelvan automaticamente la dependencia `nodejs`. Si instalas con `rpm -i`, Node debe existir antes como paquete del sistema en `/usr/bin/node`; Node instalado con `nvm` no satisface esa dependencia.

El paquete RPM requiere `rpmbuild` instalado en la maquina que genera el artefacto.
