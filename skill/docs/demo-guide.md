# Guia de demo

Esta guia ayuda a presentar la Skill como capacidad reutilizable con dos caminos claros: API REST publica y CLI Linux local.

## Mensaje principal

La Skill de validacion SQL/MongoDB se publica como una capacidad reutilizable. El core permanece en `src`, la API REST vive en `skill/service` y el CLI Linux empaqueta una copia del core para validar localmente sin depender de la API.

## Diagrama para explicar

```text
Core de validacion en src
        |
        v
Skill: capacidad de validar SQL/MongoDB
        |
        v
Metodos de acceso
   |-- Frontend Web
   |-- API REST publica
   `-- CLI Linux local
```

## Flujo recomendado

1. Mostrar la web existente validando una consulta correcta.
2. Mostrar la web detectando un error como `FORM` en lugar de `FROM`.
3. Abrir el apartado Integraciones > API REST y mostrar:

```text
https://wonderful-benevolence-production-ebaf.up.railway.app
```

4. Probar la API:

```bash
curl https://wonderful-benevolence-production-ebaf.up.railway.app/health
```

5. Abrir el apartado Integraciones > CLI Linux local y mostrar los paquetes `.tar.gz`, `.deb` y `.rpm`.
6. Ejecutar el CLI sin API:

```bash
sqlcheck validate "SELECT * FORM empleados;"
```

7. Cerrar explicando que el CLI instalado funciona dentro del entorno Linux porque incluye el core local.

## Pruebas rapidas

API:

```bash
curl -X POST https://wonderful-benevolence-production-ebaf.up.railway.app/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"engine":"auto","code":"CREATE TABL empleados (id INT);"}'
```

CLI:

```bash
cd packages/cli
npm install
npm run build
node dist/index.js validate "SELECT * FROM empleados;"
node dist/index.js validate "SELECT * FORM empleados;"
```

## Frase de presentacion

"La Skill de validacion SQL/MongoDB se publica como una capacidad reutilizable. La API REST publica sigue disponible para integraciones HTTP y, ademas, el CLI Linux se entrega como paquete instalable con el core local incluido. Esto permite validar consultas desde terminales Linux sin depender de red ni de una API remota, manteniendo intactos el despliegue de la web y el servicio API existente."
