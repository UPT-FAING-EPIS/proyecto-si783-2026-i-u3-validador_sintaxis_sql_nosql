# Publicacion de integraciones

Esta guia explica como generar y publicar la API REST existente y el CLI Linux local sin romper el despliegue actual de `skill/service` ni la web.

## 1. Verificar API actual

Desde `skill/service`:

```bash
docker build -t sql-validation-skill .
```

El Dockerfile, las variables y los endpoints de `skill/service` no cambian.

API publica:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

Prueba:

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/health
```

## 2. Generar CLI local

```bash
cd packages/cli
npm install
npm run build
```

El build copia el core desde `src/services` hacia `packages/cli/dist/core`. Por eso el CLI instalado valida localmente y no necesita API remota.

Pruebas:

```bash
node dist/index.js validate "SELECT * FROM empleados;"
node dist/index.js validate "SELECT * FORM empleados;"
node dist/index.js validate "db.usuarios.find({ activo: true })" --engine mongodb
```

## 3. Generar `.tar.gz`

```bash
cd packages/cli
npm run package:tar
```

Salida:

```text
releases/cli/sqlcheck-linux.tar.gz
```

Instalacion:

```bash
tar -xzf sqlcheck-linux.tar.gz
cd sqlcheck
sudo ./install.sh
sqlcheck --version
```

## 4. Generar `.deb`

Requiere `dpkg-deb`.

```bash
cd packages/cli
npm run package:deb
```

Salida:

```text
releases/cli/sqlcheck_1.0.0_amd64.deb
```

Instalacion:

```bash
sudo dpkg -i sqlcheck_1.0.0_amd64.deb
sqlcheck --version
```

## 5. Generar `.rpm`

Requiere `rpmbuild`.

```bash
cd packages/cli
npm run package:rpm
```

Salida:

```text
releases/cli/sqlcheck-1.0.0.x86_64.rpm
```

Instalacion:

```bash
sudo dnf install ./sqlcheck-1.0.0.x86_64.rpm
sqlcheck --version
```

Nota: `rpm -i` no resuelve dependencias. Usa `dnf install ./sqlcheck-1.0.0.x86_64.rpm` para que el sistema instale `nodejs` si falta.

## 6. Publicar descargas en la web

El servidor principal sirve archivos estaticos desde `frontend`. Coloca estos artefactos en:

```text
frontend/downloads/sqlcheck-linux.tar.gz
frontend/downloads/sqlcheck_1.0.0_amd64.deb
frontend/downloads/sqlcheck-1.0.0.x86_64.rpm
```

La seccion `Integraciones` de la web muestra dos apartados:

- API REST publica: `https://wonderful-benevolence-production-ebaf.up.railway.app`
- CLI Linux local: enlaces a `.tar.gz`, `.deb` y `.rpm`

## 7. Presentar como Skill publicada

Explicacion sugerida:

"La Skill de validacion SQL/MongoDB se publica como una capacidad reutilizable. La API REST publica sigue disponible para integraciones HTTP y, ademas, el CLI Linux se entrega como paquete instalable con el core local incluido. Esto permite validar consultas desde terminales Linux sin depender de red ni de una API remota, manteniendo intactos el despliegue de la web y el servicio API existente."
