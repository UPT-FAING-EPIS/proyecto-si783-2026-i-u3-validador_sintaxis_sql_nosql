const fs = require('fs');
const path = require('path');

function resolveOpenApiPath() {
  const candidates = [
    process.env.OPENAPI_PATH,
    path.resolve(__dirname, '../../../openapi.yaml'),
    path.resolve(process.cwd(), 'openapi.yaml')
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate));
}

function openApiYaml(req, res) {
  const openApiPath = resolveOpenApiPath();
  if (!openApiPath) {
    return res.status(404).type('text/plain').send('openapi.yaml no encontrado.');
  }
  return res.type('application/yaml').send(fs.readFileSync(openApiPath, 'utf8'));
}

function swaggerDocs(req, res) {
  res.type('html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SQL Validation Skill API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true
      });
    </script>
  </body>
</html>`);
}

module.exports = { swaggerDocs, openApiYaml };
