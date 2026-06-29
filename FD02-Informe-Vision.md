<center>

[comment]: <img src="./media/media/image1.png" style="width:1.088in;height:1.46256in" alt="escudo.png" />

![./media/media/image1.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERIA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto *Validador de Sintaxis SQL u otra***

Curso: *Base de Datos II*

Docente: *Mag. Patrick Cuadros Quiroga*

Integrantes:

***Soto Oquendo Cristian Gabriel (2026086510)***

***Arocutipa Arocutipa Gian Franco (2023076790)***

**Tacna – Perú**

***2026***

</center>

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|Soto / Arocutipa|Patrick Cuadros|Patrick Cuadros|28/03/2026|Versión Original|

**Sistema *Validador de Sintaxis SQL u otra***

**Documento de Visión**

**Versión *{1.0}***

**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|Soto / Arocutipa|Patrick Cuadros|Patrick Cuadros|28/03/2026|Versión Original|

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

**INDICE GENERAL**

[1. Introducción](#_Toc52661346)

&nbsp;&nbsp;&nbsp;&nbsp;1.1 Propósito

&nbsp;&nbsp;&nbsp;&nbsp;1.2 Alcance

&nbsp;&nbsp;&nbsp;&nbsp;1.3 Definiciones, Siglas y Abreviaturas

&nbsp;&nbsp;&nbsp;&nbsp;1.4 Referencias

&nbsp;&nbsp;&nbsp;&nbsp;1.5 Visión General

[2. Posicionamiento](#_Toc52661347)

&nbsp;&nbsp;&nbsp;&nbsp;2.1 Oportunidad de negocio

&nbsp;&nbsp;&nbsp;&nbsp;2.2 Definición del problema

[3. Descripción de los interesados y usuarios](#_Toc52661348)

&nbsp;&nbsp;&nbsp;&nbsp;3.1 Resumen de los interesados

&nbsp;&nbsp;&nbsp;&nbsp;3.2 Resumen de los usuarios

&nbsp;&nbsp;&nbsp;&nbsp;3.3 Entorno de usuario

&nbsp;&nbsp;&nbsp;&nbsp;3.4 Perfiles de los interesados

&nbsp;&nbsp;&nbsp;&nbsp;3.5 Perfiles de los Usuarios

&nbsp;&nbsp;&nbsp;&nbsp;3.6 Necesidades de los interesados y usuarios

[4. Vista General del Producto](#_Toc52661349)

&nbsp;&nbsp;&nbsp;&nbsp;4.1 Perspectiva del producto

&nbsp;&nbsp;&nbsp;&nbsp;4.2 Resumen de capacidades

&nbsp;&nbsp;&nbsp;&nbsp;4.3 Suposiciones y dependencias

&nbsp;&nbsp;&nbsp;&nbsp;4.4 Costos y precios

&nbsp;&nbsp;&nbsp;&nbsp;4.5 Licenciamiento e instalación

[5. Características del producto](#_Toc52661350)

[6. Restricciones](#_Toc52661351)

[7. Rangos de calidad](#_Toc52661352)

[8. Precedencia y Prioridad](#_Toc52661353)

[9. Otros requerimientos del producto](#_Toc52661354)

&nbsp;&nbsp;&nbsp;&nbsp;9.1 Estándares Legales

&nbsp;&nbsp;&nbsp;&nbsp;9.2 Estándares de Comunicación

&nbsp;&nbsp;&nbsp;&nbsp;9.3 Estándares de Cumplimiento de Plataforma

&nbsp;&nbsp;&nbsp;&nbsp;9.4 Estándares de Calidad y Seguridad

[CONCLUSIONES](#_Toc52661355)

[RECOMENDACIONES](#_Toc52661356)

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

**<u>Informe de Visión</u>**

1. <span id="_Toc52661346" class="anchor"></span>**Introducción**

**1.1	Propósito**

El presente documento tiene como propósito definir la visión, objetivos y lineamientos generales para el desarrollo de un Sistema Validador de Sintaxis para Bases de Datos SQL y NoSQL, orientado a verificar la correcta estructura de consultas antes de su ejecución, implementado como una aplicación web moderna bajo arquitectura cliente-servidor con patrón MVC.

El sistema permitirá a estudiantes y desarrolladores identificar errores sintácticos de manera anticipada, reduciendo fallos en tiempo de ejecución y mejorando la calidad del desarrollo de software. Para ello, se utilizan tecnologías actuales del ecosistema JavaScript como Node.js en el backend y el Monaco Editor en el frontend, integrando la librería node-sql-parser para el análisis formal de consultas SQL con soporte para múltiples dialectos.

Asimismo, el proyecto responde a la necesidad actual de trabajar tanto con bases de datos relacionales como no relacionales, integrando validaciones para ambos paradigmas dentro de una única interfaz web accesible desde cualquier navegador moderno, sin necesidad de instalación de software adicional por parte del usuario.

**1.2	Alcance**

El sistema estará enfocado en la validación de estructuras y consultas en dos tipos de bases de datos, accesible completamente desde el navegador web mediante una interfaz construida con HTML5, JavaScript vanilla y el editor Monaco:

**Bases de Datos Relacionales (SQL)**

    Sentencias SELECT con cláusulas WHERE, GROUP BY, HAVING, ORDER BY, JOIN
    Sentencias INSERT con valores simples y múltiples registros
    Sentencias UPDATE con condiciones
    Sentencias DELETE con y sin condiciones
    Soporte para dialectos: MySQL, PostgreSQL, SQLite y ANSI SQL estándar
    Detección de línea y columna exacta donde se produce el error
    Sugerencias de corrección para errores frecuentes

**Bases de Datos No Relacionales (NoSQL — MongoDB)**

    Comandos CRUD: find, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany
    Transacciones: startSession, startTransaction, commitTransaction, abortTransaction
    Sharding: enableSharding, shardCollection
    Aggregation pipeline con validación de etapas ($match, $group, $project, $sort, $lookup, $unwind, $limit, $skip)
    Operadores especializados: $mod, $text, $regex, $where, $expr, $jsonSchema, $geoWithin, $near
    Validación de estructura y formato de documentos JSON

**Funcionalidades principales de la interfaz web**

    Editor Monaco con resaltado de sintaxis específico para SQL y JSON
    Selector de dialecto SQL (MySQL, PostgreSQL, SQLite, ANSI)
    Historial de consultas validadas durante la sesión
    Ejemplos precargados por tipo y dialecto
    Subida de archivos con extensión .sql y .json para validación por lotes
    Panel de resultados con indicación de errores por línea y columna
    API REST con endpoint unificado de validación

El sistema no ejecutará consultas ni modificará bases de datos reales; su función será exclusivamente de validación sintáctica y estructural.

**1.3	Definiciones, Siglas y Abreviaturas**

|**Término**|**Definición**|
| :--- | :--- |
|**SQL**|(Structured Query Language) Lenguaje estándar para gestionar bases de datos relacionales.|
|**NoSQL**|(Not Only SQL) Conjunto de tecnologías de bases de datos no relacionales orientadas a documentos, grafos, clave-valor, etc.|
|**DML**|(Data Manipulation Language) Subconjunto de SQL para manipulación de datos: SELECT, INSERT, UPDATE, DELETE.|
|**JSON**|(JavaScript Object Notation) Formato ligero de intercambio de datos usado ampliamente en bases de datos NoSQL.|
|**MongoDB**|Sistema de base de datos NoSQL orientado a documentos que almacena datos en formato BSON (similar a JSON).|
|**Token**|Unidad mínima con significado propio que resulta del proceso de análisis léxico de una cadena de texto.|
|**Análisis Léxico**|Primera etapa del proceso de compilación. Consiste en identificar y clasificar los tokens presentes en una cadena.|
|**Análisis Sintáctico**|Segunda etapa del proceso de compilación. Verifica que la secuencia de tokens cumple con las reglas gramaticales del lenguaje.|
|**AST**|(Abstract Syntax Tree) Árbol de Sintaxis Abstracta. Representación estructurada en árbol de la sintaxis de una consulta, generada por el parser.|
|**Parser**|Componente de software encargado de realizar el análisis sintáctico de una cadena de entrada.|
|**MVC**|(Model-View-Controller) Patrón de diseño de software que separa la lógica de negocio (Modelo), la presentación (Vista) y el control del flujo (Controlador).|
|**API REST**|(Application Programming Interface — Representational State Transfer) Interfaz de programación de aplicaciones que sigue los principios REST para comunicación cliente-servidor mediante HTTP.|
|**Node.js**|Entorno de ejecución de JavaScript del lado del servidor, basado en el motor V8 de Google Chrome.|
|**Express.js**|Framework minimalista para Node.js orientado a la construcción de aplicaciones web y APIs REST.|
|**Monaco Editor**|Motor de edición de código que potencia Visual Studio Code. Proporciona resaltado de sintaxis, numeración de líneas y marcado de errores.|
|**node-sql-parser**|Librería npm de código abierto que implementa un parser completo para SQL con soporte para múltiples dialectos.|
|**Dialecto SQL**|Variante del lenguaje SQL con extensiones propias de un motor de base de datos específico (MySQL, PostgreSQL, SQLite, etc.).|
|**Debounce**|Técnica de programación que retrasa la ejecución de una función hasta que haya transcurrido un tiempo determinado sin que se vuelva a invocar, usada para optimizar la validación en tiempo real.|
|**CDN**|(Content Delivery Network) Red de distribución de contenidos utilizada para servir librerías JavaScript como Monaco Editor directamente desde el navegador.|
|**CLI**|(Command Line Interface) Interfaz de línea de comandos. En este proyecto, referida al uso de la terminal para iniciar el servidor backend.|

**1.4	Referencias**

* Informe de Factibilidad del Proyecto — Documento FD01, versión 1.0, elaborado por el equipo de desarrollo (Soto / Arocutipa), aprobado el 28/03/2026.
* Repositorio del proyecto en GitHub — Control de versiones, gestión de ramas y seguimiento de tareas mediante Issues.
* Documentación oficial de SQL estándar ANSI — ISO/IEC 9075, disponible en organismos de estándares internacionales.
* Documentación oficial de MongoDB — Disponible en https://www.mongodb.com/docs/
* Documentación oficial de Node.js v18 — Disponible en https://nodejs.org/docs/
* Documentación oficial de Express.js v4 — Disponible en https://expressjs.com/
* Repositorio oficial de node-sql-parser v4 — Disponible en https://github.com/taozhi8833998/node-sql-parser
* Documentación del Monaco Editor — Disponible en https://microsoft.github.io/monaco-editor/
* Material académico del curso de Base de Datos II — Universidad Privada de Tacna, Escuela Profesional de Ingeniería de Sistemas, ciclo 2026-I.

**1.5	Visión General**

El Sistema Validador de Sintaxis SQL y NoSQL se plantea como una herramienta web integral que permite validar consultas y estructuras de datos en diferentes paradigmas de bases de datos, contribuyendo a mejorar la calidad del software y reducir errores comunes en el desarrollo académico y profesional.

El sistema se desarrollará utilizando Node.js y Express en el backend, y HTML5 con Monaco Editor y JavaScript vanilla en el frontend, bajo el patrón de diseño MVC. Esta arquitectura garantiza una separación clara de responsabilidades, facilita el mantenimiento del código y permite escalar el sistema en el futuro sin necesidad de rediseñar la arquitectura base.

El backend expone una API REST con tres endpoints principales: un health check para verificar el estado del servidor, un endpoint para obtener ejemplos precargados por tipo de consulta, y un endpoint unificado de validación que recibe la consulta, el tipo de lenguaje y, en el caso de SQL, el dialecto seleccionado. El frontend consume esta API mediante solicitudes HTTP asíncronas y presenta los resultados al usuario directamente en el editor Monaco, marcando visualmente las líneas con errores.

Además, el sistema está diseñado con una visión escalable, permitiendo futuras mejoras como:

* Soporte para más motores NoSQL (Cassandra, Redis, DynamoDB).
* Integración con entornos de desarrollo mediante extensiones de VS Code o plugins.
* Validación semántica más avanzada (verificación de nombres de tablas y columnas contra un esquema).
* Exportación de reportes de validación en formato PDF o JSON.
* Autenticación de usuarios y almacenamiento persistente del historial de consultas.

De esta manera, el proyecto no solo cumple un propósito académico, sino que también sienta las bases para el desarrollo de herramientas más complejas en el ámbito profesional del desarrollo de software orientado a datos.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

2. <span id="_Toc52661347" class="anchor"></span>**Posicionamiento**

**2.1	Oportunidad de negocio**

**Situación del mercado**

En la actualidad, el desarrollo de software depende en gran medida del uso de bases de datos tanto relacionales como no relacionales. Diversos estudios y experiencias en la industria indican que una proporción significativa de los errores en aplicaciones de software está directamente relacionada con consultas mal estructuradas o sintácticamente incorrectas que llegan a ejecutarse en entornos de desarrollo o incluso producción.

Además:

* Existen múltiples herramientas como DataGrip, MySQL Workbench, pgAdmin o MongoDB Compass que permiten interactuar con bases de datos, pero:
  * Están enfocadas en ejecución y administración, no en validación previa e independiente.
  * Requieren instalación de software pesado, configuración de conexiones y acceso a un motor de base de datos activo.
  * Muchas requieren licencias comerciales o cuentas de pago para acceder a sus funcionalidades completas.
* No existe actualmente una herramienta web, ligera, gratuita y multiplataforma que permita validar sintaxis SQL y NoSQL en una misma interfaz, sin necesidad de conexión a un motor de base de datos real, accesible directamente desde el navegador.
* En entornos académicos, los estudiantes cometen errores sintácticos frecuentes y no cuentan con herramientas especializadas de retroalimentación inmediata. Los mensajes de error de los DBMS son con frecuencia crípticos y difíciles de interpretar para usuarios en proceso de aprendizaje.
* Las herramientas online existentes (como SQLFiddle, db-fiddle o Mongo Playground) están orientadas a la ejecución de consultas en entornos simulados, no a la validación sintáctica pura con retroalimentación pedagógica.

**Oportunidad**

Se identifica una oportunidad concreta en los siguientes segmentos de usuarios:

* Estudiantes de ingeniería de sistemas, computación y programación, que requieren herramientas de apoyo accesibles para aprender SQL y NoSQL sin necesidad de configurar entornos locales complejos.
* Desarrolladores junior y semi-senior, que necesitan validar la corrección sintáctica de sus consultas antes de ejecutarlas en bases de datos de desarrollo o producción.
* Docentes universitarios de cursos de bases de datos, que buscan herramientas para apoyar la enseñanza práctica de SQL y NoSQL en clases presenciales o virtuales.
* Proyectos académicos y open source, donde no se dispone de presupuesto para herramientas comerciales y se requiere una solución ligera y de fácil despliegue.

El sistema propuesto cubre esta necesidad al ofrecer una aplicación web de acceso inmediato desde el navegador, sin instalación, con soporte para los dialectos SQL más usados y para MongoDB, y con una interfaz de calidad profesional basada en el Monaco Editor.

**Ventaja competitiva**

El sistema presenta ventajas importantes frente a las herramientas existentes en el mercado:

* **Acceso web inmediato:** No requiere instalación. El usuario accede desde su navegador y comienza a validar consultas de inmediato.
* **Multi-paradigma en una sola herramienta:** Soporta SQL (MySQL, PostgreSQL, SQLite, ANSI) y NoSQL (MongoDB) dentro de la misma interfaz, sin necesidad de cambiar de herramienta.
* **Editor de código profesional:** La integración del Monaco Editor proporciona una experiencia comparable a la de un IDE de desarrollo, con resaltado de sintaxis, numeración de líneas y marcado visual de errores.
* **Retroalimentación precisa:** Informa al usuario no solo que hay un error, sino en qué línea y columna se encuentra, y proporciona sugerencias de corrección cuando es posible.
* **Gratuito y de código abierto:** Sin costos de licencia ni suscripción, distribuido bajo licencia MIT.
* **Arquitectura moderna y extensible:** Construido con Node.js, Express y el patrón MVC, lo que facilita su mantenimiento y extensión futura.

**2.2	Definición del problema**

**Problema actual**

Un estudiante o desarrollador que trabaja con bases de datos enfrenta dificultades reales al momento de escribir y validar consultas correctamente sin contar con una herramienta especializada:

* **Errores sintácticos frecuentes y difíciles de detectar:** La escritura de sentencias SQL complejas o estructuras de documentos MongoDB es propensa a errores de sintaxis que no son evidentes a simple vista, especialmente para usuarios con poca experiencia.
* **Dependencia de ejecución real para detectar errores:** En el flujo habitual, para saber si una consulta es sintácticamente correcta es necesario ejecutarla contra un motor de base de datos activo. Esto implica tener un servidor configurado y disponible, consumir recursos del servidor y asumir el riesgo de efectos secundarios no deseados.
* **Falta de herramientas educativas especializadas:** No existen validadores web gratuitos que expliquen los errores de forma clara y pedagógica, indicando la posición exacta del error y sugiriendo cómo corregirlo.
* **Diferencias entre dialectos SQL y paradigmas NoSQL:** Cada motor de base de datos tiene sus propias extensiones y variaciones del SQL estándar. Esto genera confusión en usuarios que trabajan con múltiples tecnologías y no tienen claridad sobre qué sintaxis es válida para cada motor.
* **Curva de aprendizaje elevada para NoSQL:** Las consultas y operaciones en MongoDB, especialmente los pipelines de agregación y los operadores avanzados, tienen una estructura significativamente diferente al SQL relacional, lo que representa un desafío adicional para los desarrolladores en transición.

**Síntomas**

* Tiempo valioso perdido en ciclos repetitivos de escribir, ejecutar y corregir consultas erróneas en el DBMS.
* Frustración en estudiantes al recibir mensajes de error del motor de base de datos que no explican claramente cuál es el problema ni cómo resolverlo.
* Uso incorrecto de sintaxis específica de un dialecto SQL en un contexto donde se requiere otro, generando errores de compatibilidad.
* Baja calidad general de las consultas desarrolladas en proyectos académicos por falta de retroalimentación oportuna.
* Dependencia excesiva del docente o de compañeros más experimentados para identificar y corregir errores básicos de sintaxis.

**Impacto**

* Retrasos en el cronograma de proyectos de desarrollo de software por tiempo invertido en depuración de consultas.
* Mayor probabilidad de que errores de sintaxis lleguen a entornos de producción, con el riesgo de interrupciones del servicio o corrupción de datos.
* Dificultad en el proceso de aprendizaje autónomo de SQL y NoSQL, que reduce la velocidad de adquisición de competencias técnicas.
* Baja eficiencia en el desarrollo de proyectos académicos, con impacto directo en la calidad de las entregas y evaluaciones.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

3. <span id="_Toc52661348" class="anchor"></span>**Descripción de los interesados y usuarios**

**3.1	Resumen de los interesados**

En el desarrollo del sistema validador de sintaxis SQL y NoSQL participan diversos actores con intereses específicos que influyen directamente en el diseño, funcionalidades y criterios de calidad del sistema.

Entre los principales interesados se encuentran los **estudiantes desarrolladores** (Soto Oquendo Cristian Gabriel y Arocutipa Arocutipa Gian Franco), quienes asumen el rol de equipo de desarrollo y aplican sus conocimientos de programación web, Node.js, arquitectura MVC y bases de datos para construir el sistema. Los **docentes asesores**, encargados de evaluar la calidad técnica y académica del proyecto, ejercen influencia directa en la validación de los requerimientos y la aprobación del producto final. **La institución universitaria** (Universidad Privada de Tacna), que promueve el desarrollo de competencias profesionales en sus estudiantes a través de proyectos aplicados. Y **la comunidad académica y tecnológica**, conformada por estudiantes de otros ciclos y desarrolladores externos que podrían beneficiarse del uso de la herramienta en el futuro.

Adicionalmente, se consideran interesados potenciales a contribuidores externos que podrían participar en el desarrollo de extensiones o mejoras al sistema a través del repositorio público en GitHub.

**3.2	Resumen de los usuarios**

Los usuarios del sistema corresponden a perfiles relacionados con el aprendizaje y el desarrollo de software con bases de datos, principalmente:

* **Estudiantes de ingeniería de sistemas y áreas afines**, que utilizarán la herramienta para practicar y comprender la sintaxis de consultas SQL en sus múltiples dialectos, así como la estructura de documentos y operaciones en MongoDB.
* **Desarrolladores junior**, quienes requieren validar la corrección sintáctica de sus consultas antes de ejecutarlas en entornos de desarrollo o producción, reduciendo el riesgo de errores en producción.
* **Docentes de cursos de bases de datos**, que pueden utilizar la herramienta como recurso didáctico en clases prácticas, proyectando la validación en tiempo real de consultas de ejemplo.

**3.3	Entorno de usuario**

El sistema será utilizado principalmente en entornos académicos y personales, desde computadoras individuales con conexión a internet.

Las condiciones de uso incluyen:

* **Dispositivos:** Laptops, computadoras de escritorio o tablets con navegador moderno.
* **Sistemas operativos:** Windows, Linux y macOS (cualquier sistema que soporte un navegador web moderno).
* **Acceso:** Aplicación web accesible desde navegador, sin instalación requerida por parte del usuario final.
* **Tecnologías del frontend:** HTML5, CSS3, JavaScript vanilla, Monaco Editor (cargado desde CDN).
* **Tecnologías del backend:** Node.js v18+, Express.js, node-sql-parser v4.
* **Despliegue:** Servidor Node.js ejecutable localmente o en plataformas de hosting gratuitas como Render o Railway.

El sistema funcionará sin necesidad de conexión a motores de bases de datos reales, procesando las validaciones completamente en el servidor Node.js. Esto permite su uso en laboratorios universitarios, hogares o cualquier entorno con acceso a un navegador web.

**3.4	Perfiles de los interesados**

**Perfil 1 – Estudiante Desarrollador (Equipo de Desarrollo)**

   * **Descripción:** Integrantes del equipo que diseñan, desarrollan y documentan el sistema. Cristian Soto lidera el desarrollo backend (Node.js, Express, API REST, módulos de validación) y Gian Franco Arocutipa lidera el desarrollo frontend (HTML5, Monaco Editor, integración con la API, diseño de interfaz).
   * **Intereses:** Aplicar conocimientos adquiridos en el curso, completar el proyecto dentro del plazo académico, y desarrollar competencias profesionales en desarrollo web full-stack con arquitectura MVC.
   * **Influencia:** Alta, ya que el equipo define la arquitectura, las tecnologías y las funcionalidades implementadas.

**Perfil 2 – Docente Asesor**

   * **Descripción:** Mag. Patrick Cuadros Quiroga, responsable de la evaluación académica y técnica del proyecto en el marco del curso de Base de Datos II.
   * **Intereses:** Calidad técnica del software, correcta aplicación del patrón MVC, uso adecuado de las tecnologías definidas (Node.js, Express, Monaco Editor, node-sql-parser), y completitud de la documentación.
   * **Influencia:** Alta en la validación del producto final y la calificación académica del proyecto.

**Perfil 3 – Institución Académica (Universidad Privada de Tacna)**

   * **Descripción:** Entidad que respalda el desarrollo del proyecto como parte de su programa de formación profesional en Ingeniería de Sistemas.
   * **Intereses:** Formación de profesionales competentes, cumplimiento de estándares académicos y generación de proyectos con valor aplicado real.
   * **Influencia:** Media en la orientación general del trabajo y los criterios de evaluación.

**Perfil 4 – Comunidad Tecnológica y Académica (Potencial)**

   * **Descripción:** Estudiantes de otros ciclos, docentes de otras materias y desarrolladores externos interesados en utilizar o contribuir al sistema.
   * **Intereses:** Acceso gratuito a la herramienta, posibilidad de extender sus funcionalidades, contribución al repositorio open source.
   * **Influencia:** Baja en la versión actual, pero con potencial de crecimiento significativo en versiones futuras.

**3.5	Perfiles de los Usuarios**

**Usuario Tipo 1 – Principiante**

   * **Perfil:** Estudiante universitario de primeros ciclos, sin experiencia previa significativa en bases de datos ni en lenguajes de consulta.
   * **Objetivo:** Comprender la estructura correcta de consultas SQL básicas (SELECT, INSERT, UPDATE, DELETE) y entender qué errores comete al escribirlas.
   * **Necesidades:**
      * Mensajes de error redactados en lenguaje claro y comprensible, sin tecnicismos innecesarios.
      * Indicación visual clara de dónde está el error dentro del código.
      * Ejemplos precargados que sirvan como punto de partida y referencia.
      * Sugerencias de corrección que orienten sobre cómo resolver el error detectado.

**Usuario Tipo 2 – Intermedio**

   * **Perfil:** Estudiante avanzado o desarrollador junior con conocimientos funcionales de SQL y familiaridad básica con MongoDB.
   * **Objetivo:** Validar la corrección sintáctica de consultas antes de ejecutarlas en un entorno de desarrollo, y aprender las diferencias entre los distintos dialectos SQL.
   * **Necesidades:**
      * Precisión en la validación, con indicación de línea y columna exacta del error.
      * Soporte para múltiples dialectos SQL con posibilidad de cambiar entre ellos fácilmente.
      * Validación de estructuras MongoDB incluyendo operadores de consulta y pipelines de agregación.
      * Historial de consultas validadas durante la sesión para retomar trabajo previo.

**Usuario Tipo 3 – Avanzado**

   * **Perfil:** Desarrollador con experiencia sólida en bases de datos relacionales y no relacionales, que busca una herramienta de validación rápida integrable en su flujo de trabajo.
   * **Objetivo:** Utilizar la herramienta como validador rápido antes de incluir consultas en código de aplicación, y aprovechar la funcionalidad de carga de archivos .sql y .json para validación por lotes.
   * **Necesidades:**
      * Alta confiabilidad en las validaciones, con mínimos falsos positivos o negativos.
      * Soporte completo para operadores avanzados de MongoDB (aggregation pipeline, transacciones, sharding).
      * Capacidad de subir archivos .sql y .json para validación sin necesidad de copiar y pegar manualmente.
      * Respuesta rápida de la API (menos de 200ms por validación).

**3.6	Necesidades de los interesados y usuarios**

Los distintos actores del sistema presentan necesidades específicas que el proyecto busca satisfacer de forma integral:

Los **estudiantes** requieren una herramienta web que les permita practicar SQL y MongoDB de forma autónoma, identificar sus errores con mensajes comprensibles, y aprender de ellos mediante sugerencias de corrección, sin necesidad de tener un servidor de base de datos configurado localmente.

Los **desarrolladores** necesitan validar la corrección sintáctica de sus consultas con precisión y rapidez, obteniendo información de la línea y columna exacta del error, antes de ejecutarlas en entornos reales donde un error puede tener consecuencias graves.

Los **docentes** requieren un medio accesible y visualmente atractivo que apoye sus clases prácticas de bases de datos, permitiéndoles demostrar en tiempo real la diferencia entre consultas correctas e incorrectas en distintos dialectos SQL y en MongoDB.

La **comunidad académica** se beneficia de contar con una herramienta gratuita, open source, sin requerimientos de instalación y con una interfaz de calidad profesional que puede ser adoptada y adaptada en distintos contextos educativos.

En conjunto, el sistema responde a estas necesidades mediante:

* Validación automática y precisa de sintaxis SQL multi-dialecto y NoSQL MongoDB
* Retroalimentación clara con indicación de posición exacta del error y sugerencias de corrección
* Interfaz web de calidad profesional basada en Monaco Editor, accesible desde el navegador
* Soporte para carga de archivos .sql y .json para validación por lotes
* Historial de consultas y ejemplos precargados para facilitar el aprendizaje
* API REST bien documentada para posible integración con otras herramientas

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

4. <span id="_Toc52661349" class="anchor"></span>**Vista General del Producto**

**4.1	Perspectiva del producto**

El **Validador de Sintaxis SQL u otra (NoSQL)** se concibe como una aplicación web de página única (SPA) que actúa como una capa de validación sintáctica independiente entre el usuario y los motores de bases de datos, tanto SQL como NoSQL. Desde una perspectiva arquitectónica, el sistema no reemplaza a los DBMS ni a sus validadores internos, sino que los complementa mediante una validación previa, unificada, accesible y pedagógicamente orientada.

La solución está construida bajo el patrón de diseño **MVC (Modelo-Vista-Controlador)**, con una separación clara entre capas:

* **Modelo (backend — Node.js + Express):** Contiene la lógica de negocio del sistema. El archivo `validation.service.js` implementa los algoritmos de validación para SQL (usando `node-sql-parser`) y para MongoDB (mediante reglas estructurales propias). El modelo no tiene conocimiento de cómo se presentan los resultados; únicamente procesa la entrada y devuelve una respuesta estructurada.

* **Vista (frontend — HTML5 + Monaco Editor + JS vanilla):** Constituye la interfaz que el usuario ve y con la que interactúa en el navegador. El archivo `index.html` define la estructura de la página, `styles.css` aplica el diseño visual, y `app.js` gestiona la lógica de interacción: capturar la consulta del editor Monaco, enviarla al backend mediante la API REST, y presentar los resultados al usuario marcando visualmente los errores en el editor.

* **Controlador (backend — Express routes + controllers):** Los archivos `validate.routes.js` y `validation.controller.js` actúan como intermediarios entre las solicitudes HTTP del frontend y la lógica del modelo. El controlador recibe la solicitud, extrae y valida los parámetros de entrada, invoca el servicio de validación apropiado, y construye la respuesta HTTP estandarizada.

El sistema procesa consultas provenientes de cuatro dialectos SQL (MySQL, PostgreSQL, SQLite, ANSI) y de MongoDB, interpreta sus reglas sintácticas específicas mediante la librería `node-sql-parser v4` para SQL y mediante un módulo de validación estructural propio para NoSQL, y devuelve los resultados al frontend en formato JSON con información detallada de cada error detectado.

**Estructura de archivos del proyecto:**

```
backend/
├── services/
│   └── validation.service.js     # Lógica de validación SQL/NoSQL
├── controllers/
│   └── validation.controller.js  # Manejadores de endpoints HTTP
├── middleware/
│   ├── errorHandler.middleware.js # Manejo centralizado de errores
│   └── logger.middleware.js       # Registro de solicitudes HTTP
├── routes/
│   └── validate.routes.js         # Definición de rutas de la API
└── server.js                      # Punto de entrada del servidor

frontend/
├── index.html   # Vista principal (estructura de la interfaz)
├── app.js       # Lógica del cliente (integración con Monaco y la API)
└── styles.css   # Estilos de la interfaz
```

**4.2	Resumen de capacidades**

* **Validación SQL multi-dialecto:** El sistema verifica la corrección sintáctica de consultas SQL escritas para MySQL, PostgreSQL, SQLite y ANSI SQL estándar, utilizando la librería `node-sql-parser v4`. Para cada consulta válida, genera un AST (Árbol de Sintaxis Abstracta) interno. Para cada consulta inválida, reporta el tipo de error, la línea y la columna exacta donde se detectó el problema, y cuando es posible, una sugerencia de corrección.

* **Validación NoSQL para MongoDB:** El sistema valida la corrección estructural y sintáctica de operaciones MongoDB, incluyendo comandos CRUD (find, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany), operaciones de transacción (startSession, startTransaction, commitTransaction, abortTransaction), operaciones de sharding (enableSharding, shardCollection), pipelines de agregación con sus etapas correspondientes, y operadores especializados como $mod, $text, $regex, $where, $expr, $jsonSchema, $geoWithin y $near.

* **Interfaz web profesional con Monaco Editor:** El frontend incorpora el mismo motor de edición que utiliza Visual Studio Code, proporcionando resaltado de sintaxis específico para SQL y JSON, numeración de líneas, y la capacidad de marcar visualmente las líneas con errores directamente en el editor mediante decoraciones de color.

* **Selector de dialecto SQL:** El usuario puede seleccionar el dialecto SQL objetivo (MySQL, PostgreSQL, SQLite, ANSI) mediante un menú desplegable en la interfaz, y el sistema ajustará automáticamente las reglas de validación del parser en consecuencia.

* **Historial de consultas de la sesión:** El sistema mantiene un registro de las consultas validadas durante la sesión actual del usuario, permitiéndole recuperar consultas anteriores sin necesidad de volver a escribirlas.

* **Ejemplos precargados:** La interfaz incluye un conjunto de ejemplos predefinidos para los principales tipos de consultas SQL y operaciones MongoDB, accesibles mediante el endpoint `GET /api/examples`, que sirven como punto de partida y referencia para el usuario.

* **Carga de archivos .sql y .json:** El usuario puede subir archivos de consultas directamente desde su sistema de archivos para validarlos sin necesidad de copiar y pegar su contenido manualmente en el editor.

* **API REST documentada:** El backend expone tres endpoints bien definidos:
  * `GET /api/health` — Verifica que el servidor está operativo.
  * `GET /api/examples` — Devuelve ejemplos de consultas válidas por tipo y dialecto.
  * `POST /api/validate` — Recibe `{type, query, dialect?}` y devuelve el resultado de la validación.

**4.3	Suposiciones y dependencias**

**Suposiciones técnicas:**

Se asume que el servidor donde se despliega el backend cuenta con Node.js v18 o superior instalado. Se asume que los usuarios finales utilizan un navegador web moderno (Google Chrome v90+, Mozilla Firefox v88+, Microsoft Edge v90+ o Safari v14+) que soporte las APIs de JavaScript necesarias para el funcionamiento del Monaco Editor cargado desde CDN. Se asume disponibilidad de conexión a internet en el lado del cliente para la carga inicial del Monaco Editor desde su CDN.

**Dependencias técnicas del backend:**

* `Node.js v18+` — Plataforma de ejecución del servidor.
* `Express.js v4` — Framework para la construcción de la API REST.
* `node-sql-parser v4` — Librería para el análisis sintáctico de SQL con soporte multi-dialecto y generación de AST.

**Dependencias técnicas del frontend:**

* `Monaco Editor` — Cargado desde CDN. Proporciona el editor de código con resaltado de sintaxis y capacidad de marcar errores visualmente.
* `HTML5 / CSS3 / JavaScript vanilla` — Sin dependencias de frameworks frontend adicionales (React, Vue, Angular, etc.), lo que simplifica la arquitectura y reduce el tamaño del proyecto.

El sistema no depende de ningún servicio externo de bases de datos para realizar las validaciones. Todas las validaciones se realizan en memoria dentro del proceso Node.js del servidor.

**4.4	Costos y precios**

El **Validador de Sintaxis SQL u otra (NoSQL)** es una herramienta completamente gratuita tanto para su uso como para su despliegue:

* **Costo de uso para el usuario final:** S/. 0. La herramienta es de acceso libre.
* **Costo de despliegue:** S/. 0 en plataformas de hosting gratuitas compatibles con Node.js, como Render (plan gratuito), Railway (plan hobby) o Vercel (con configuración serverless de Express).
* **Costo de dependencias:** S/. 0. Todas las librerías utilizadas (Express, node-sql-parser, Monaco Editor) son de código abierto y gratuitas.
* **Distribución:** Libre mediante repositorio público en GitHub bajo licencia MIT.
* **Mantenimiento:** Basado en contribución académica del equipo de desarrollo durante el ciclo 2026-I.

El proyecto tiene un enfoque académico y de apoyo a la comunidad, sin fines de lucro, orientado a mejorar las prácticas de desarrollo en bases de datos en el contexto educativo de la Universidad Privada de Tacna y más allá.

**4.5	Licenciamiento e instalación**

El sistema se distribuye bajo **licencia MIT**, una de las licencias de software libre más permisivas, que permite el uso, copia, modificación, fusión, publicación, distribución, sublicenciamiento y/o venta de copias del software tanto en entornos académicos como comerciales, con la única condición de mantener el aviso de copyright y la licencia en todas las copias.

Todas las dependencias del proyecto son compatibles con licencias open source (Express: MIT, node-sql-parser: MIT, Monaco Editor: MIT), garantizando transparencia legal y facilidad de adopción.

**Instalación para desarrollo local (equipo de desarrollo):**

El proceso de instalación y ejecución local es simple y estándar para proyectos Node.js:

1. Clonar el repositorio desde GitHub.
2. Ejecutar `npm install` en el directorio `backend/` para instalar las dependencias.
3. Iniciar el servidor con `node server.js` o `npm start`.
4. Abrir el archivo `frontend/index.html` en el navegador, o configurar Express para servir los archivos estáticos del frontend.

**Acceso para el usuario final:**

El usuario final no realiza ningún proceso de instalación. Simplemente accede a la URL donde está desplegado el sistema desde su navegador preferido y comienza a utilizar la herramienta de inmediato.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

5. <span id="_Toc52661350" class="anchor"></span>**Características del producto**

El **Validador de Sintaxis SQL u otra (NoSQL)** se define como una herramienta web especializada en la validación y análisis de consultas para bases de datos, construida con Node.js, Express y Monaco Editor bajo el patrón MVC, diseñada para ofrecer una experiencia eficiente, precisa y pedagógicamente orientada. Sus funcionalidades se presentan como capacidades integradas que permiten validar, interpretar y mejorar consultas antes de su ejecución en un motor de base de datos real.

A continuación se describen las principales características del sistema desde un enfoque funcional:

* **Validación previa e independiente de la ejecución**
El sistema analiza la corrección sintáctica de las consultas exclusivamente desde el punto de vista gramatical, sin conectarse a ningún motor de base de datos. Esta independencia garantiza que el proceso de validación sea seguro (sin riesgo de efectos secundarios sobre datos reales), rápido (sin latencia de red hacia un DBMS) y accesible (sin necesidad de tener una base de datos configurada y disponible).

* **Soporte para múltiples dialectos SQL en una sola interfaz**
Mediante la integración de `node-sql-parser v4`, el sistema soporta la validación de consultas escritas para MySQL, PostgreSQL, SQLite y ANSI SQL estándar. El usuario selecciona el dialecto mediante un menú desplegable y el parser ajusta automáticamente sus reglas gramaticales. Esto permite trabajar con distintos motores sin cambiar de herramienta.

* **Validación avanzada de operaciones MongoDB**
El módulo de validación NoSQL cubre el espectro completo de operaciones MongoDB utilizadas habitualmente en desarrollo: operaciones CRUD, transacciones multi-documento, configuraciones de sharding, pipelines de agregación con todas sus etapas estándar, y operadores de consulta avanzados. Esto convierte al sistema en una herramienta útil tanto para aprendizaje básico como para desarrollo profesional con MongoDB.

* **Retroalimentación precisa con indicación de posición del error**
A diferencia de los mensajes genéricos de muchos DBMS, el sistema proporciona información detallada sobre cada error detectado: tipo de error, descripción comprensible, línea y columna exacta dentro del editor donde se localiza el problema. Esta precisión permite al usuario identificar y corregir el error de forma eficiente.

* **Editor de código Monaco con marcado visual de errores**
La integración del Monaco Editor (el mismo motor de Visual Studio Code) eleva significativamente la calidad de la experiencia de usuario. El editor resalta la sintaxis SQL y JSON con colores, numera las líneas de código, y cuando se detectan errores, los marca visualmente con subrayados de color rojo directamente en las líneas afectadas, tal como lo hace un IDE de desarrollo profesional.

* **Historial de consultas de la sesión y ejemplos precargados**
El sistema mantiene un historial de las consultas validadas durante la sesión activa del usuario, permitiendo recuperar y revisar consultas anteriores sin necesidad de reescribirlas. Adicionalmente, el endpoint `GET /api/examples` provee un conjunto de ejemplos de consultas correctas e incorrectas por tipo y dialecto, que sirven como referencia y punto de partida para el aprendizaje.

* **Carga de archivos para validación por lotes**
Los usuarios que trabajan con colecciones de consultas o scripts SQL pueden cargar directamente archivos con extensión `.sql` o `.json` desde su sistema de archivos, sin necesidad de copiar y pegar el contenido manualmente. El sistema procesa el contenido del archivo y presenta los resultados de validación de todas las sentencias encontradas.

* **API REST estructurada y extensible**
El backend expone una API REST bien definida con tres endpoints (`GET /health`, `GET /examples`, `POST /validate`) que siguen las convenciones estándar de diseño de APIs RESTful. Esta estructura facilita la integración del validador como servicio en otras aplicaciones o herramientas externas, y sienta las bases para futuras extensiones de la API.

* **Arquitectura MVC mantenible y escalable**
La separación clara entre el modelo (lógica de validación en `validation.service.js`), la vista (interfaz web en el directorio `frontend/`) y el controlador (manejadores de rutas en `validation.controller.js`) garantiza que el código sea mantenible, testeable y extensible. Agregar soporte para un nuevo dialecto SQL o un nuevo motor NoSQL implica únicamente modificar o extender el servicio de validación, sin impactar el resto de la arquitectura.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

6. <span id="_Toc52661351" class="anchor"></span>**Restricciones**

El **Validador de Sintaxis SQL u otra (NoSQL)** operará bajo un conjunto de restricciones de carácter técnico, organizacional y operativo que deben ser consideradas durante su desarrollo e implementación. Estas limitaciones definen el alcance real del sistema y garantizan su viabilidad dentro del contexto y tiempo del proyecto académico.

**Restricciones técnicas**

* **Cobertura de dialectos SQL:** En su versión inicial, el sistema soporta cuatro dialectos SQL: MySQL, PostgreSQL, SQLite y ANSI. La incorporación de soporte para dialectos adicionales como Microsoft SQL Server o Oracle SQL depende de las capacidades de la versión de `node-sql-parser` utilizada y quedará pendiente para versiones futuras.

* **Alcance de la validación NoSQL:** El módulo de validación MongoDB cubre las operaciones y operadores más utilizados en desarrollo cotidiano, pero no pretende ser un parser completo de toda la especificación de MongoDB. Operaciones muy específicas o características experimentales del motor pueden no estar cubiertas en esta versión.

* **Solo validación sintáctica, no semántica:** El sistema verifica exclusivamente que la estructura gramatical de la consulta sea correcta según las reglas del lenguaje. No realiza validación semántica, es decir, no verifica si los nombres de tablas, columnas, bases de datos o colecciones existen realmente en ningún esquema. Una consulta como `SELECT columna_inexistente FROM tabla_inexistente` será considerada válida desde el punto de vista sintáctico.

* **Entorno de ejecución del backend:** El servidor requiere Node.js v18 o superior. Versiones anteriores de Node.js pueden no ser compatibles con las dependencias utilizadas.

* **Dependencia del CDN para Monaco Editor:** El frontend carga el Monaco Editor desde una CDN pública de internet. En entornos sin conectividad a internet, el editor no estará disponible. Para despliegues en entornos offline sería necesario alojar el Monaco Editor localmente.

* **Interfaz de usuario basada en navegador:** El sistema es exclusivamente una aplicación web. No existe una versión de escritorio instalable ni una CLI (línea de comandos) para el usuario final; la CLI mencionada en la arquitectura aplica únicamente para la ejecución del servidor backend por parte del administrador.

**Restricciones organizacionales**

* **Alcance y tiempo académico:** El desarrollo del sistema está limitado por la duración del ciclo académico 2026-I y el tiempo disponible del equipo de dos integrantes. Esto implica que se priorizarán las funcionalidades de mayor valor e impacto sobre las características secundarias o de presentación.

* **Equipo reducido:** El proyecto es desarrollado por dos estudiantes, lo que determina el volumen de funcionalidades que pueden implementarse con alta calidad dentro del plazo disponible.

* **Uso exclusivo de tecnologías definidas:** El proyecto debe desarrollarse obligatoriamente con el stack tecnológico definido (Node.js, Express, Monaco Editor, node-sql-parser), sin posibilidad de sustituir estas tecnologías por otras aunque pudieran resultar más convenientes para algún caso específico.

**Restricciones operativas**

* **Sesión sin persistencia:** El historial de consultas se mantiene únicamente durante la sesión activa del usuario en el navegador. Al cerrar o recargar la página, el historial se pierde. No existe almacenamiento persistente de datos del usuario en la versión actual.

* **Validación sin ejecución real:** Por diseño, el sistema nunca ejecuta las consultas recibidas contra ningún motor de base de datos. Esta restricción es intencional y garantiza la seguridad del sistema, pero implica que la validación está limitada al nivel sintáctico.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

7. <span id="_Toc52661352" class="anchor"></span>**Rangos de Calidad**

El **Validador de Sintaxis SQL u otra (NoSQL)** define sus estándares de calidad a partir de métricas cuantificables que permiten evaluar el desempeño, la confiabilidad y la utilidad del sistema durante su desarrollo y operación.

**Disponibilidad del sistema**

El servidor backend debe mantener una disponibilidad mínima del 99% durante los períodos de uso académico. Dado que el sistema opera como una aplicación web desplegada en una plataforma de hosting, el tiempo de inactividad estará asociado únicamente a actualizaciones del software o mantenimiento planificado de la plataforma de hosting. Las nuevas versiones del sistema deben ser validadas en un entorno de desarrollo antes de ser desplegadas en producción.

**Precisión de validación SQL**

El módulo de validación SQL debe alcanzar una precisión mínima del 95% en la detección correcta de errores sintácticos sobre un conjunto de prueba representativo de consultas válidas e inválidas para cada dialecto soportado. Esto implica que al menos 95 de cada 100 consultas del conjunto de prueba deben ser clasificadas correctamente como válidas o inválidas.

**Precisión de validación NoSQL**

El módulo de validación MongoDB debe alcanzar una precisión mínima del 90% en la detección de estructuras inválidas sobre un conjunto de prueba de operaciones y documentos MongoDB. El umbral es ligeramente inferior al de SQL debido a la mayor flexibilidad estructural de MongoDB y la complejidad adicional de validar operadores avanzados.

**Consistencia de resultados**

Para una misma consulta, el mismo tipo de lenguaje y el mismo dialecto (en el caso de SQL), el sistema debe producir siempre el mismo resultado de validación. La validación es determinista y no debe verse afectada por el orden de las solicitudes ni por el estado interno del servidor entre una solicitud y otra.

**Tiempo de respuesta de la API**

El endpoint `POST /api/validate` debe responder en un tiempo máximo de 500 milisegundos para consultas de longitud estándar (hasta 50 líneas de código) en condiciones normales de operación. El objetivo deseable es un tiempo de respuesta inferior a 200 milisegundos, que garantiza una experiencia de validación percibida como instantánea por el usuario.

**Rendimiento bajo carga concurrente**

El servidor debe ser capaz de procesar al menos 20 solicitudes de validación simultáneas sin degradación significativa del tiempo de respuesta ni errores de procesamiento. Este umbral es adecuado para el contexto académico de uso, donde el sistema podría ser utilizado simultáneamente por múltiples estudiantes en una misma clase práctica.

**Seguridad de la API**

El backend debe implementar validación de los parámetros de entrada del endpoint `POST /api/validate` para rechazar solicitudes con parámetros faltantes o de tipo incorrecto, devolviendo respuestas HTTP con códigos de error apropiados (400 Bad Request). El middleware `errorHandler.middleware.js` debe capturar y gestionar de forma centralizada todos los errores no controlados, evitando que se expongan detalles internos del servidor en las respuestas de error.

**Escalabilidad funcional**

El diseño del módulo de validación debe permitir la incorporación de soporte para nuevos dialectos SQL o nuevos tipos de operaciones MongoDB sin necesidad de modificar la arquitectura general del sistema. Esto se garantiza mediante la separación de la lógica de validación en `validation.service.js`, que actúa como el único punto de extensión para nuevas capacidades de validación.

**Mantenibilidad del código**

El código fuente debe seguir las convenciones estándar de estilo para JavaScript (ESLint con configuración estándar), incluyendo nombres de variables y funciones en camelCase, comentarios JSDoc en las funciones públicas del servicio de validación, y estructura de archivos coherente con el patrón MVC definido. La cobertura de pruebas unitarias del módulo `validation.service.js` debe ser de al menos el 70%.

**Usabilidad**

Un usuario con conocimientos básicos de SQL debe ser capaz de comprender y utilizar todas las funcionalidades del sistema en un tiempo máximo de 10 minutos desde su primer acceso, sin necesidad de leer documentación adicional. La interfaz debe ser autoexplicativa, con etiquetas, botones y mensajes de retroalimentación claros e intuitivos.

**Compatibilidad con navegadores**

El sistema debe funcionar correctamente en las versiones actuales de Google Chrome, Mozilla Firefox, Microsoft Edge y Safari. El Monaco Editor cargado desde CDN es compatible con todos estos navegadores en sus versiones modernas.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

8. <span id="_Toc52661353" class="anchor"></span>**Precedencia y Prioridad**

Las funcionalidades del Validador de Sintaxis SQL u otra se organizan según su impacto en el valor entregado al usuario y el tiempo disponible de desarrollo dentro del período académico de 4 semanas. El proyecto contempla alcanzar un sistema completamente funcional en sus capacidades core al finalizar la semana 4, priorizando primero la construcción del núcleo de validación y la API REST, y posteriormente la interfaz web y las funcionalidades de valor añadido.

**Prioridad 1 – Crítica (Semana 1: Arquitectura y backend base)**

Fase enfocada en construir la estructura del proyecto y el núcleo de validación SQL.

* **Estructura del proyecto MVC:** Creación de la estructura de directorios `backend/` y `frontend/` con todos los archivos definidos en la arquitectura (server.js, routes, controllers, services, middleware).
* **Servidor Express funcional:** Configuración del servidor Node.js con Express, definición de middlewares de logging y manejo de errores, y arranque correcto del servidor en el puerto configurado.
* **Módulo de validación SQL base:** Integración de `node-sql-parser v4` y desarrollo de la lógica de validación para el dialecto MySQL como punto de partida. El servicio debe ser capaz de recibir una consulta SQL, analizarla con el parser, y devolver el resultado con información de errores en caso de ser inválida.
* **Endpoint POST /api/validate funcional para SQL:** El controlador y la ruta deben estar operativos, recibiendo `{type: "sql", query, dialect}` y devolviendo una respuesta JSON estructurada.

**Prioridad 2 – Alta (Semana 2: Soporte multi-dialecto y validación NoSQL)**

Se amplían las capacidades del módulo de validación y se completa la API REST.

* **Soporte completo para dialectos SQL:** Extensión del módulo de validación para soportar PostgreSQL, SQLite y ANSI además de MySQL. El dialecto debe ser recibido como parámetro y pasado correctamente al parser.
* **Módulo de validación NoSQL para MongoDB:** Desarrollo del validador de operaciones MongoDB, comenzando por las operaciones CRUD y la validación de documentos JSON, y progresivamente incorporando transacciones, sharding y el aggregation pipeline.
* **Endpoints GET /api/health y GET /api/examples:** Implementación de los endpoints auxiliares de la API para verificación del estado del servidor y obtención de ejemplos precargados.
* **Detección de línea y columna en errores SQL:** Asegurar que la respuesta de validación incluya la información de posición del error (línea y columna) cuando el parser la provea.

**Prioridad 3 – Media (Semana 3: Frontend e integración)**

Se construye la interfaz de usuario y se conecta con el backend.

* **Estructura HTML y estilos CSS:** Diseño y maquetación de la interfaz principal en `index.html` y `styles.css`, incluyendo el área del editor, el selector de tipo de lenguaje y dialecto, los botones de acción y el panel de resultados.
* **Integración del Monaco Editor:** Carga del Monaco Editor desde CDN y configuración del resaltado de sintaxis para SQL y JSON. Conexión del contenido del editor con la lógica de `app.js`.
* **Conexión frontend-backend:** Implementación en `app.js` de las solicitudes HTTP asíncronas al endpoint `POST /api/validate`, incluyendo el mecanismo de debounce para la validación en tiempo real.
* **Visualización de errores en el editor:** Implementación del marcado visual de errores directamente en las líneas del Monaco Editor mediante sus APIs de decoraciones.
* **Panel de resultados:** Presentación de los errores detectados en el panel de resultados con descripción, línea y columna de cada error.

**Prioridad 4 – Finalización (Semana 4: Funcionalidades de valor añadido, pruebas y documentación)**

Etapa enfocada en completar las funcionalidades de valor añadido, corregir errores y documentar el sistema.

* **Historial de consultas de la sesión:** Implementación del historial de consultas validadas durante la sesión en el frontend.
* **Ejemplos precargados en la interfaz:** Integración del consumo del endpoint `GET /api/examples` para mostrar ejemplos en la interfaz.
* **Carga de archivos .sql y .json:** Implementación de la funcionalidad de subida de archivos para validación por lotes.
* **Pruebas de integración:** Pruebas end-to-end del flujo completo (frontend → API → servicio de validación → respuesta → visualización en editor) para los principales casos de uso.
* **Corrección de bugs:** Resolución de los errores identificados durante las pruebas de integración.
* **Documentación técnica:** README del repositorio con instrucciones de instalación, uso y descripción de la API. Comentarios JSDoc en el código del servicio de validación.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

9. <span id="_Toc52661354" class="anchor"></span>**Otros requerimientos del producto**

**9.1 Estándares Legales**

El proyecto debe cumplir con normativas de protección de datos y propiedad intelectual, considerando que opera como una herramienta web que recibe consultas de texto ingresadas por el usuario.

* **Licencia del proyecto:**
El sistema se distribuye bajo **licencia MIT**, compatible con todas las dependencias utilizadas (Express: MIT, node-sql-parser: MIT, Monaco Editor: MIT), permitiendo uso, modificación y distribución sin restricciones.

* **Privacidad de datos:**
El sistema cumple con los principios aplicables de la **Ley N.° 29733** (Ley de Protección de Datos Personales del Perú) y los principios generales del RGPD (Unión Europea) en lo que respecta a minimización y no persistencia de datos:
  * Las consultas ingresadas por el usuario son procesadas en memoria dentro del servidor Node.js para realizar la validación y son descartadas inmediatamente después de generar la respuesta. No se almacenan en ninguna base de datos ni sistema de archivos del servidor.
  * El sistema no recopila, almacena ni transmite a terceros ningún dato personal del usuario.
  * No se implementa ningún sistema de autenticación, por lo que el sistema no recopila credenciales ni datos de identidad.

* **Propiedad intelectual:**
El código fuente del sistema es desarrollado íntegramente por el equipo de proyecto (Soto / Arocutipa) durante el ciclo 2026-I. Las librerías externas utilizadas son reconocidas y atribuidas correctamente en el archivo `package.json` del proyecto y en la documentación.

**9.2 Estándares de Comunicación**

El sistema define estándares claros para la comunicación entre sus componentes y para la documentación técnica del proyecto.

* **Protocolo de comunicación cliente-servidor:**
La comunicación entre el frontend y el backend utiliza exclusivamente **HTTP/HTTPS** con el formato de intercambio de datos **JSON** (Content-Type: application/json). Las respuestas de la API siguen una estructura estandarizada:
  * Respuesta exitosa: `{ "valid": true/false, "errors": [...], "dialect": "..." }`
  * Error de la API: `{ "error": "descripción del error", "statusCode": 400/500 }`

* **Documentación técnica:**
Disponible en formato **Markdown** dentro del repositorio del proyecto (`/docs` y `README.md`), con ejemplos prácticos de uso de la API y de la interfaz.

* **Archivo README:**
Debe incluir como mínimo:
  * Descripción general del sistema y su arquitectura MVC.
  * Instrucciones de instalación y ejecución local paso a paso.
  * Descripción de los endpoints de la API con ejemplos de solicitudes y respuestas.
  * Dialectos SQL y operaciones MongoDB soportadas.
  * Ejemplos de consultas válidas e inválidas para cada tipo de lenguaje.

* **Convenciones del código fuente:**
  * Nombres de archivos: kebab-case con sufijo del tipo (ej. `validation.service.js`, `errorHandler.middleware.js`).
  * Variables y funciones: camelCase.
  * Constantes: UPPER_SNAKE_CASE.
  * Commits en Git: Conventional Commits (feat:, fix:, docs:, refactor:, test:).

* **Gestión de incidencias:**
Uso de **GitHub Issues** con etiquetas por tipo (bug, enhancement, documentation) y criterios de aceptación definidos para cada tarea.

**9.3 Estándares de Cumplimiento de Plataforma**

El sistema debe ser compatible con los entornos de ejecución modernos y seguir las buenas prácticas del ecosistema Node.js.

* **Versión de Node.js:**
Node.js v18 LTS (Long Term Support) como versión mínima requerida, garantizando acceso a las APIs modernas de JavaScript (ESModules, fetch nativo, etc.) y soporte de seguridad a largo plazo.

* **Gestión de dependencias:**
Uso de `npm` como gestor de paquetes. El archivo `package.json` debe especificar las versiones exactas de las dependencias de producción para garantizar la reproducibilidad del entorno.

* **Compatibilidad con sistemas operativos:**
El servidor backend es compatible con Windows, Linux y macOS, cualquier sistema que soporte Node.js v18+. El frontend es compatible con cualquier sistema que disponga de un navegador web moderno.

* **Versionado del software:**
Uso de **Semantic Versioning** (MAJOR.MINOR.PATCH):
  * v0.x.x: versiones en desarrollo activo.
  * v1.0.0: primera versión estable con todas las funcionalidades de Prioridad 1 y 2 completas.

* **Variables de entorno:**
La configuración del servidor (puerto, entorno de ejecución) debe gestionarse mediante variables de entorno definidas en un archivo `.env`, nunca hardcodeadas en el código fuente. El archivo `.env` no debe incluirse en el repositorio Git (añadido a `.gitignore`).

**9.4 Estándares de Calidad y Seguridad**

El sistema implementa prácticas para garantizar confiabilidad, seguridad y mantenibilidad del código.

* **Validación de entrada en la API:**
El endpoint `POST /api/validate` debe validar obligatoriamente los campos `type` (valores permitidos: "sql", "nosql") y `query` (cadena de texto no vacía) antes de invocar el servicio de validación. Solicitudes con parámetros faltantes o inválidos deben ser rechazadas con respuesta HTTP 400 Bad Request y un mensaje de error descriptivo.

* **Manejo centralizado de errores:**
El middleware `errorHandler.middleware.js` debe capturar todos los errores no controlados del servidor, registrarlos en el logger y devolver una respuesta HTTP 500 con un mensaje genérico, sin exponer detalles internos de la implementación (stack traces, nombres de archivos, etc.) al cliente.

* **Logging de solicitudes:**
El middleware `logger.middleware.js` debe registrar cada solicitud recibida por el servidor con al menos la siguiente información: timestamp, método HTTP, ruta, código de respuesta y tiempo de procesamiento. Esto facilita la depuración y el monitoreo del servidor durante el desarrollo y la operación.

* **Protección contra entrada maliciosa:**
Aunque el sistema no ejecuta las consultas recibidas contra ningún motor de base de datos, debe implementar un límite de tamaño máximo en el cuerpo de las solicitudes HTTP (mediante el middleware `express.json({ limit: '1mb' })`) para prevenir ataques de denegación de servicio por envío de payloads extremadamente grandes.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661355" class="anchor"></span>**CONCLUSIONES**

El Validador de Sintaxis SQL u otra (NoSQL), desarrollado como aplicación web con arquitectura MVC sobre Node.js, Express y Monaco Editor, se presenta como un proyecto técnicamente sólido, funcionalmente completo para su alcance definido, y de alto valor educativo, destacando por los siguientes aspectos:

**Resolución de una necesidad real con tecnología moderna**

La validación sintáctica previa a la ejecución de consultas es una necesidad concreta en el flujo de trabajo de desarrolladores y estudiantes. El sistema la resuelve mediante una interfaz web de calidad profesional, accesible desde el navegador sin instalación, con soporte para los cuatro dialectos SQL más utilizados y para el conjunto esencial de operaciones MongoDB. La elección de Node.js y Express garantiza un backend ligero, eficiente y de fácil despliegue.

**Factibilidad técnica confirmada con el stack definido**

El desarrollo del sistema es completamente viable con las tecnologías seleccionadas. `node-sql-parser v4` provee un parser robusto y bien mantenido para SQL multi-dialecto. El Monaco Editor aporta una experiencia de edición de código de nivel profesional directamente en el navegador. La arquitectura MVC asegura una base de código organizada, mantenible y extensible.

**Arquitectura extensible que protege la inversión de desarrollo**

El patrón MVC y la separación del módulo de validación en `validation.service.js` como único punto de extensión garantizan que las futuras mejoras del sistema (nuevos dialectos SQL, nuevos motores NoSQL, validación semántica, exportación de resultados) puedan implementarse sin necesidad de reescribir la arquitectura existente. Esta extensibilidad protege el trabajo invertido en el desarrollo de la versión actual.

**Bajo costo y alta accesibilidad**

El costo total del proyecto, estimado en S/. 1,693.00, es mínimo en comparación con el valor que genera. El uso exclusivo de tecnologías de código abierto bajo licencia MIT elimina los costos de licenciamiento y permite el despliegue gratuito en plataformas de hosting compatibles con Node.js. La accesibilidad web elimina las barreras de instalación para los usuarios finales.

**Alto impacto pedagógico en el contexto académico**

El sistema aborda directamente las dificultades que enfrentan los estudiantes de Base de Datos II al aprender SQL y MongoDB: falta de herramientas de validación accesibles, mensajes de error poco descriptivos, y necesidad de tener un DBMS configurado para practicar. Al eliminar estas barreras y proporcionar retroalimentación clara con indicación de la posición exacta del error y sugerencias de corrección, el sistema tiene el potencial de acelerar significativamente el proceso de aprendizaje de los lenguajes de consulta de bases de datos.

**Recomendado para implementación y uso académico**

En función de los análisis de factibilidad técnica, económica, operativa, legal, social y ambiental realizados, y considerando la solidez de la arquitectura propuesta y las tecnologías seleccionadas, se concluye que el proyecto es completamente viable y se recomienda su desarrollo, despliegue y adopción como herramienta complementaria en el curso de Base de Datos II de la Escuela Profesional de Ingeniería de Sistemas de la Universidad Privada de Tacna.

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661356" class="anchor"></span>**RECOMENDACIONES**

**Inicio inmediato con la configuración del proyecto**

Dado que los análisis de factibilidad son favorables y el stack tecnológico está claramente definido, se recomienda comenzar el desarrollo sin demoras. La primera acción debe ser la creación de la estructura de directorios del proyecto (`backend/` y `frontend/`) con todos los archivos definidos en la arquitectura MVC, la inicialización del repositorio Git con el archivo `.gitignore` y el `package.json` del backend, y la instalación de las dependencias iniciales (Express y node-sql-parser).

**Validar node-sql-parser con casos reales antes de avanzar**

Antes de construir el resto del backend sobre el módulo de validación SQL, se recomienda dedicar tiempo suficiente a explorar y probar el comportamiento de `node-sql-parser v4` con un conjunto amplio de consultas de prueba para cada dialecto soportado. Es fundamental entender cómo reporta los errores el parser (estructura del objeto de error, campos disponibles, información de posición) para diseñar correctamente la respuesta de la API desde el principio.

**Definir y documentar el contrato de la API antes de desarrollar el frontend**

Se recomienda definir y documentar formalmente la estructura de las respuestas JSON de todos los endpoints de la API (`/health`, `/examples`, `/validate`) antes de comenzar el desarrollo del frontend. Esto garantiza que el equipo trabaje con un contrato claro entre las capas, evita inconsistencias y permite que ambos componentes se desarrollen en paralelo con mayor independencia.

**Gestión de tiempos con planes de contingencia**

Considerando el plazo de 4 semanas y el alcance definido, se plantean tres escenarios de entrega:

* **Plan A (completo):** Sistema con todas las funcionalidades de las 4 semanas: validación SQL multi-dialecto, validación MongoDB completa (CRUD, transacciones, sharding, aggregation, operadores avanzados), interfaz Monaco con marcado visual de errores, historial, ejemplos precargados y carga de archivos.
* **Plan B (intermedio):** Sistema con validación SQL completa (todos los dialectos), validación MongoDB para operaciones CRUD y aggregation básica, interfaz Monaco funcional con panel de resultados, sin historial ni carga de archivos.
* **Plan C (mínimo viable):** Sistema con validación SQL para MySQL y PostgreSQL, validación MongoDB para operaciones CRUD básicas, interfaz web funcional con editor de texto simple (sin Monaco) y panel de resultados.

En todos los casos, la API REST debe estar correctamente estructurada con los tres endpoints definidos.

**Implementar pruebas unitarias del servicio de validación desde el inicio**

Se recomienda escribir las pruebas unitarias del módulo `validation.service.js` en paralelo con su desarrollo, no al final del proyecto. Definir desde el principio el conjunto de casos de prueba (consultas válidas e inválidas para cada dialecto y tipo) permite detectar problemas del parser o del módulo NoSQL de forma temprana y garantiza que las modificaciones futuras no rompan casos que ya funcionaban correctamente.

**Mantener comunicación continua con el docente**

Se sugiere presentar avances intermedios al Mag. Patrick Cuadros Quiroga al finalizar cada semana de desarrollo, mostrando el estado del sistema, los desafíos encontrados y las decisiones técnicas tomadas. Esta comunicación permite obtener retroalimentación oportuna, validar el enfoque del desarrollo, y gestionar expectativas sobre el alcance final del sistema entregado.

**Documentar el proceso de desarrollo, no solo el resultado**

Además de la documentación técnica del sistema (README, JSDoc), se recomienda mantener un registro del proceso de desarrollo: decisiones de arquitectura tomadas, problemas encontrados y cómo fueron resueltos, y lecciones aprendidas. Este registro tiene valor académico adicional y facilita la elaboración del informe final del proyecto.
