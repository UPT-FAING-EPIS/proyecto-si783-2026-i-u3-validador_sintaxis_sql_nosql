<center>

![Logo UPT](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERÍA**

**Escuela Profesional de Ingeniería de Sistemas**

---

# Proyecto: **"VALIDADOR DE SINTAXIS SQL U OTRA"**

**Curso:** Base de Datos II

**Docente:** Mag. Patrick Cuadros Quiroga

**Integrantes:**

- Soto Oquendo Cristian Gabriel — Código: 2026086510
- Arocutipa Arocutipa Gian Franco — Código: 2023076790

**Tacna – Perú**

***2026***

</center>

---

# **Sistema Validador de Sintaxis SQL u Otra**
## **Informe de Factibilidad**

**Versión:** 1.0
**Fecha de elaboración:** 28 de marzo de 2026
**Estado del documento:** Aprobado

---

### **CONTROL DE VERSIONES**

| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
|:--------|:----------|:-------------|:-------------|:------|:-------|
| 1.0 | Soto / Arocutipa | Patrick Cuadros | Patrick Cuadros | 28/03/2026 | Versión original, ampliada con enfoque web y validación multi-dialecto |

---

# **ÍNDICE GENERAL** 
1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Riesgos](#2-riesgos)
3. [Análisis de la Situación Actual](#3-análisis-de-la-situación-actual)
4. [Estudio de Factibilidad](#4-estudio-de-factibilidad)
   - 4.1 [Factibilidad Técnica](#41-factibilidad-técnica)
   - 4.2 [Factibilidad Económica](#42-factibilidad-económica)
   - 4.3 [Factibilidad Operativa](#43-factibilidad-operativa)
   - 4.4 [Factibilidad Legal](#44-factibilidad-legal)
   - 4.5 [Factibilidad Social](#45-factibilidad-social)
   - 4.6 [Factibilidad Ambiental](#46-factibilidad-ambiental)
5. [Análisis Financiero](#5-análisis-financiero)
6. [Conclusiones](#6-conclusiones)

---

# **1. Descripción del Proyecto**

## **1.1 Nombre del Proyecto**

**Validador de Sintaxis SQL u Otra**

El nombre del proyecto refleja con precisión el alcance funcional de la herramienta: un sistema capaz de validar la sintaxis de consultas escritas en el lenguaje estándar SQL (Structured Query Language), así como en otros lenguajes de consulta utilizados en sistemas de gestión de bases de datos modernos, como los comandos y estructuras de consulta empleados en MongoDB, un motor de base de datos NoSQL ampliamente adoptado en la industria tecnológica actual.

La denominación "u otra" hace alusión a la arquitectura extensible del sistema, que permite incorporar soporte para nuevos lenguajes o dialectos de consulta en el futuro, sin necesidad de rediseñar la solución desde cero.

---

## **1.2 Duración del Proyecto**

El proyecto tiene una duración estimada de **cuatro (4) semanas calendario**, comprendidas entre el inicio del ciclo académico 2026-I y la fecha de entrega oficial establecida por el docente a cargo del curso de Base de Datos II. Este período ha sido distribuido de forma estratégica para asegurar que cada etapa del desarrollo cuente con el tiempo suficiente para ser ejecutada con calidad.

El enfoque metodológico adoptado es **incremental e iterativo**, lo cual significa que el sistema no se construye en una sola fase monolítica, sino que se van desarrollando módulos funcionales progresivamente. Cada semana culmina con un entregable verificable, lo que facilita la detección temprana de errores, permite ajustes a los requerimientos en caso de ser necesario, y asegura que el equipo de desarrollo mantenga un ritmo constante de avance.

### **Distribución Detallada del Tiempo por Semanas**

| Semana | Actividades Principales | Resultado Esperado |
|:-------|:------------------------|:-------------------|
| **Semana 1** | Levantamiento de requerimientos funcionales y no funcionales. Análisis de herramientas y librerías disponibles. Diseño de la arquitectura del sistema bajo el patrón MVC (Modelo-Vista-Controlador). Definición del stack tecnológico. Elaboración del diagrama de flujo general del sistema. | Documento de diseño técnico aprobado por el equipo. Diagrama de arquitectura definido. Stack tecnológico seleccionado. |
| **Semana 2** | Desarrollo del backend: configuración del servidor con Node.js y Express, implementación de los endpoints de la API REST, integración de la librería `node-sql-parser` para la validación sintáctica de SQL, e implementación del módulo de validación para consultas MongoDB. Pruebas unitarias de los servicios de backend. | API REST funcional con endpoints de validación operativos. Módulo de validación SQL y NoSQL integrado y probado. |
| **Semana 3** | Desarrollo del frontend: configuración del editor de código Monaco Editor en la interfaz web, diseño y maquetación de la interfaz de usuario, integración del frontend con los endpoints del backend, implementación de la visualización de errores con indicadores visuales en el editor. | Interfaz web completamente operativa y conectada al backend. Editor de código funcional con retroalimentación visual en tiempo real. |
| **Semana 4** | Integración final de todos los módulos del sistema. Pruebas de integración y pruebas de aceptación. Corrección de bugs detectados. Elaboración de la documentación técnica y el manual de usuario. Presentación del sistema al docente. | Sistema completo, documentado y listo para presentación académica. |

---

## **1.3 Descripción Detallada del Proyecto**

### **1.3.1 Contexto y Motivación**

En el ámbito académico y profesional relacionado con el manejo de bases de datos, uno de los problemas más recurrentes que enfrentan tanto estudiantes como desarrolladores es la ejecución de consultas con errores de sintaxis directamente sobre los sistemas gestores de bases de datos (DBMS, por sus siglas en inglés). Este comportamiento, aunque habitual, conlleva consecuencias negativas: desde el consumo innecesario de recursos del servidor, pasando por la exposición de datos sensibles ante consultas mal formuladas, hasta la pérdida de tiempo derivada de mensajes de error poco descriptivos que dificultan la comprensión y corrección de los fallos.

El presente proyecto surge como respuesta directa a esta problemática. Se propone el desarrollo de un **sistema web de validación sintáctica** que permita al usuario verificar la corrección gramatical de sus consultas SQL y NoSQL antes de ejecutarlas en un entorno real, actuando como una capa de validación previa, independiente de cualquier motor de base de datos.

### **1.3.2 Descripción del Sistema**

El **Validador de Sintaxis SQL u Otra** es una aplicación web de página única (SPA, Single Page Application) que incorpora un editor de código avanzado en el que el usuario puede escribir o pegar sus consultas de base de datos. El sistema procesa estas consultas en tiempo real o bajo demanda, analiza su estructura gramatical y devuelve al usuario una retroalimentación clara y precisa sobre la validez o los errores encontrados.

A nivel conceptual, el sistema emula el comportamiento de las primeras etapas de un **compilador de lenguaje formal**, específicamente las fases de análisis léxico y análisis sintáctico. A diferencia de un compilador completo, no genera código ejecutable ni realiza análisis semántico profundo, sino que se enfoca en determinar si la estructura de la consulta es gramaticalmente correcta según las reglas del lenguaje consultado.

#### **Etapas del Proceso de Validación**

**Etapa 1 — Análisis Léxico (Tokenización):**
En esta primera fase, el sistema descompone la cadena de texto ingresada por el usuario en unidades mínimas de significado denominadas **tokens**. Un token puede ser una palabra reservada del lenguaje (como `SELECT`, `FROM`, `WHERE`, `INSERT`, `UPDATE`, `DELETE`), un identificador de tabla o columna, un operador (`=`, `>`, `<`, `!=`), un literal numérico o de cadena, o un signo de puntuación (`,`, `;`, `(`, `)`). El análisis léxico descarta los espacios en blanco y comentarios, y construye una secuencia ordenada de tokens que representa la consulta de forma estructurada. Si durante este proceso se encuentra un carácter o secuencia de caracteres que no corresponde a ningún token válido del lenguaje, se genera un **error léxico**.

**Etapa 2 — Análisis Sintáctico (Parsing):**
Con la lista de tokens obtenida en la etapa anterior, el sistema procede a verificar si la secuencia de tokens cumple con las **reglas gramaticales** del lenguaje. En el caso de SQL estándar, estas reglas definen, por ejemplo, que una sentencia `SELECT` debe ir seguida de una lista de columnas o el símbolo `*`, luego la cláusula `FROM` con el nombre de una tabla, y opcionalmente cláusulas como `WHERE`, `GROUP BY`, `ORDER BY`, etc. Si la secuencia de tokens no satisface estas reglas, el analizador sintáctico genera un **error de sintaxis**, indicando la posición aproximada del problema dentro de la consulta.

**Etapa 3 — Detección y Clasificación de Errores:**
Los errores identificados durante las etapas anteriores son procesados y clasificados según su tipo y severidad. El sistema distingue entre errores críticos (que impiden completamente la interpretación de la consulta), advertencias (situaciones que pueden ser válidas en algunos dialectos pero no en otros), y sugerencias (mejoras de buenas prácticas que no constituyen errores formales).

**Etapa 4 — Generación de Retroalimentación:**
Finalmente, el sistema construye una respuesta estructurada que incluye el estado general de la validación (válida/inválida), la lista detallada de errores encontrados con su descripción, la línea y columna aproximada donde se detectó cada error, y cuando sea posible, una sugerencia de corrección. Esta respuesta es enviada al frontend y presentada al usuario de forma visual, resaltando las líneas problemáticas directamente en el editor de código.

---

### **1.3.3 Arquitectura del Sistema**

El sistema está diseñado bajo una **arquitectura cliente-servidor**, que separa claramente las responsabilidades entre la capa de presentación (frontend) y la capa de procesamiento y lógica de negocio (backend). Esta separación favorece la mantenibilidad, la escalabilidad y la posibilidad de reutilizar el backend como un servicio independiente que podría ser consumido por otras aplicaciones en el futuro.

#### **Capa Frontend (Cliente)**

El frontend es la interfaz con la que el usuario interactúa directamente desde su navegador web. Está desarrollado en HTML5, CSS3 y JavaScript puro (Vanilla JS), sin dependencia de frameworks pesados, lo que garantiza tiempos de carga rápidos y compatibilidad con la mayoría de los navegadores modernos.

El elemento central del frontend es el **Monaco Editor**, que es el mismo motor de edición de código que utiliza Visual Studio Code, uno de los entornos de desarrollo integrado más populares del mundo. Su integración aporta al sistema características profesionales como:

- Resaltado de sintaxis (syntax highlighting) específico para SQL.
- Numeración de líneas para facilitar la identificación de errores.
- Autocompletado básico de palabras reservadas.
- Marcado visual de líneas con errores mediante subrayados de color rojo.
- Soporte para múltiples pestañas o paneles de edición simultáneos.

Adicionalmente, la interfaz cuenta con un panel de resultados donde se muestra el detalle de los errores detectados, clasificados por tipo y con indicación de su posición en el texto.

#### **Capa Backend (Servidor)**

El backend está implementado en **Node.js** utilizando el framework **Express.js**. Esta decisión tecnológica se justifica por varias razones: Node.js es una plataforma de alto rendimiento para el manejo de operaciones de entrada/salida no bloqueantes, Express.js es un framework minimalista y flexible para la construcción de APIs REST, y el ecosistema npm (Node Package Manager) provee librerías especializadas para el análisis de SQL que simplifican considerablemente el desarrollo.

El backend expone una **API REST** con los siguientes endpoints principales:

- `POST /api/validate/sql` — Recibe una consulta SQL en el cuerpo de la solicitud y devuelve el resultado de su validación sintáctica.
- `POST /api/validate/nosql` — Recibe una consulta en formato MongoDB (JSON) y devuelve el resultado de su validación estructural.
- `GET /api/health` — Endpoint de verificación del estado del servidor (health check).

La librería principal para el análisis de SQL es **node-sql-parser**, una biblioteca de código abierto que implementa un parser completo para SQL estándar con soporte para múltiples dialectos, entre ellos MySQL, PostgreSQL, SQLite, Microsoft SQL Server y Oracle SQL. Esta librería es capaz de convertir una consulta SQL en un **Árbol de Sintaxis Abstracta (AST)**, lo que permite no solo determinar si la consulta es válida, sino también extraer información estructural de ella.

#### **Patrón de Diseño MVC**

El código del sistema está organizado siguiendo el **patrón de diseño Modelo-Vista-Controlador (MVC)**:

- **Modelo:** Contiene la lógica de negocio central del sistema, es decir, los módulos de validación sintáctica para SQL y NoSQL. Es la parte del sistema que realmente "sabe" cómo analizar una consulta.
- **Vista:** Corresponde al frontend, es decir, toda la interfaz de usuario que se muestra en el navegador. Es la parte del sistema que el usuario ve e interactúa.
- **Controlador:** Son los manejadores de rutas de Express.js que actúan como intermediarios entre las solicitudes del usuario (recibidas desde el frontend) y la lógica del modelo. El controlador recibe la solicitud, extrae los datos necesarios, invoca los servicios del modelo, y construye la respuesta que se envía de vuelta al cliente.

---

### **1.3.4 Flujo de Funcionamiento Detallado**

A continuación se describe paso a paso el flujo completo que sigue una consulta desde que el usuario la escribe hasta que recibe la retroalimentación:

1. **Ingreso de la consulta:** El usuario accede al sistema desde su navegador web y escribe o pega una consulta SQL o MongoDB en el editor Monaco. Puede seleccionar el tipo de lenguaje a validar mediante un menú desplegable.

2. **Activación de la validación:** La validación puede activarse de dos formas: de forma automática, con un pequeño retardo (debounce) después de que el usuario deja de escribir; o de forma manual, haciendo clic en el botón "Validar".

3. **Envío al servidor:** El frontend recopila el texto de la consulta y el tipo de lenguaje seleccionado, y realiza una solicitud HTTP POST al endpoint correspondiente de la API REST del backend.

4. **Procesamiento en el backend:** El controlador de la API recibe la solicitud, extrae los parámetros, e invoca el servicio de validación apropiado. El servicio ejecuta el análisis léxico y sintáctico de la consulta utilizando la librería especializada. Si la consulta es válida, construye una respuesta de éxito. Si contiene errores, construye una lista detallada de los errores encontrados.

5. **Respuesta al cliente:** El backend devuelve una respuesta en formato JSON al frontend, con la información de validación estructurada.

6. **Presentación de resultados:** El frontend recibe la respuesta y actualiza la interfaz: si la consulta es válida, muestra un mensaje de confirmación en verde. Si hay errores, los muestra en el panel de resultados y, cuando es posible, resalta las líneas problemáticas directamente en el editor Monaco mediante indicadores visuales de color rojo.

7. **Corrección iterativa:** El usuario revisa los errores reportados, corrige su consulta en el editor, y puede volver a ejecutar la validación cuantas veces sea necesario hasta obtener una consulta sintácticamente correcta.

---

### **1.3.5 Características Principales del Sistema**

- **Validación multi-dialecto SQL:** El sistema soporta la validación de consultas escritas para diferentes motores de bases de datos relacionales, incluyendo MySQL, PostgreSQL, SQLite, Microsoft SQL Server y Oracle. Esto es posible gracias a que la librería `node-sql-parser` incluye gramáticas específicas para cada uno de estos dialectos, reconociendo las variaciones y extensiones propias de cada motor.

- **Soporte para MongoDB (NoSQL):** Además de SQL relacional, el sistema implementa un módulo de validación para documentos y consultas de MongoDB, validando la estructura JSON de los documentos, la sintaxis de los operadores de consulta (como `$eq`, `$gt`, `$in`, `$and`, `$or`) y la correcta formación de pipelines de agregación.

- **Detección de errores con precisión:** El sistema no se limita a indicar si una consulta es válida o inválida, sino que proporciona información detallada sobre cada error: tipo de error, descripción legible para el usuario, línea y columna aproximada dentro del editor.

- **Interfaz profesional e intuitiva:** La integración del Monaco Editor proporciona una experiencia de uso comparable a la de un IDE profesional, con resaltado de sintaxis, numeración de líneas y marcado visual de errores, todo dentro de una interfaz web limpia y responsiva.

- **Sin dependencias de bases de datos reales:** El sistema opera completamente de forma estática en cuanto a la validación, sin necesidad de conectarse a ningún motor de base de datos real. Esto lo hace seguro, portátil y de fácil despliegue.

- **Arquitectura escalable:** El diseño modular del sistema permite agregar soporte para nuevos lenguajes de consulta (como Cassandra Query Language, HiveQL, o PL/SQL) simplemente incorporando nuevos módulos de validación en el backend, sin necesidad de modificar el resto de la arquitectura.

---

## **1.4 Objetivos**

### **1.4.1 Objetivo General**

Desarrollar una aplicación web robusta, funcional y de fácil acceso que permita a estudiantes, desarrolladores y profesionales de tecnología validar la sintaxis de consultas SQL y NoSQL de manera eficiente, precisa y sin necesidad de conexión a un sistema gestor de bases de datos real, contribuyendo así a la mejora de la calidad del código de consultas y a la reducción de errores en entornos de desarrollo y producción.

### **1.4.2 Objetivos Específicos**

- **Implementar la arquitectura MVC:** Organizar el código del sistema bajo el patrón de diseño Modelo-Vista-Controlador, asegurando una separación clara entre la lógica de negocio, la presentación y el flujo de control de la aplicación, lo que facilita el mantenimiento y la extensibilidad del sistema.

- **Desarrollar un backend escalable con Node.js y Express:** Construir una API REST bien estructurada que exponga los servicios de validación de forma clara, con manejo adecuado de errores HTTP, validación de entrada y respuestas estandarizadas en formato JSON.

- **Integrar el editor de código Monaco Editor:** Proporcionar al usuario una experiencia de edición de código de calidad profesional, con resaltado de sintaxis, numeración de líneas, y capacidad para marcar visualmente los errores detectados directamente en el código.

- **Validar múltiples dialectos SQL:** Implementar la capacidad de validar consultas escritas para distintos motores de bases de datos relacionales (MySQL, PostgreSQL, SQLite, SQL Server, Oracle), permitiendo al usuario seleccionar el dialecto de su preferencia.

- **Implementar validación de estructuras NoSQL para MongoDB:** Desarrollar un módulo específico que valide la corrección sintáctica y estructural de consultas y documentos MongoDB, incluyendo soporte para los operadores de consulta más comunes.

- **Mejorar la experiencia de usuario mediante retroalimentación detallada:** Diseñar el sistema para que los mensajes de error sean comprensibles para usuarios con distintos niveles de experiencia, indicando claramente qué está mal, dónde está el error, y cuando sea posible, cómo corregirlo.

- **Reducir los errores de sintaxis en entornos de producción:** Al proveer una herramienta de validación previa, el sistema busca disminuir la frecuencia con la que consultas con errores de sintaxis llegan a ejecutarse en bases de datos de producción, lo que puede generar interrupciones del servicio o pérdida de datos.

- **Facilitar el aprendizaje de SQL y NoSQL en contextos académicos:** Posicionar el sistema como una herramienta pedagógica que apoye a los estudiantes en el proceso de aprendizaje de los lenguajes de consulta de bases de datos, permitiéndoles experimentar y corregir sus consultas de forma iterativa y sin riesgo.

---

# **2. Riesgos**

## **2.1 Identificación de Riesgos**

Todo proyecto de desarrollo de software enfrenta incertidumbres que pueden afectar su correcta ejecución. A continuación se presenta una identificación y análisis detallado de los principales riesgos identificados para este proyecto, junto con la evaluación de su probabilidad de ocurrencia y el impacto que tendrían sobre el sistema en caso de materializarse.

| Riesgo | Probabilidad | Impacto | Descripción Detallada |
|:-------|:-------------|:--------|:----------------------|
| **Dependencia de librerías externas** | Media | Alta | El sistema depende de la librería `node-sql-parser` para el análisis sintáctico de SQL. Si esta librería presenta limitaciones en el soporte de ciertos dialectos, genera falsos positivos/negativos, o deja de recibir mantenimiento, la calidad de la validación se vería comprometida. |
| **Diferencias entre dialectos SQL** | Alta | Media | El SQL estándar (SQL-92, SQL-99, SQL:2003) difiere en varios aspectos de los dialectos específicos de cada motor de base de datos. MySQL, PostgreSQL y SQL Server, por ejemplo, tienen extensiones propietarias, funciones y sintaxis que pueden no ser reconocidas por el parser genérico. |
| **Problemas de rendimiento en tiempo real** | Media | Media | La validación en tiempo real (mientras el usuario escribe) implica múltiples llamadas al backend en cortos intervalos de tiempo. Sin una implementación adecuada de mecanismos de debounce y una API eficiente, esto podría generar latencia perceptible o sobrecarga del servidor. |
| **Escalabilidad ante alta carga de usuarios** | Baja | Alta | Si el sistema es adoptado masivamente en el contexto académico o se expone públicamente, el servidor podría recibir un volumen de solicitudes simultáneas superior a su capacidad actual, resultando en tiempos de respuesta elevados o caídas del servicio. |
| **Complejidad de la validación NoSQL (MongoDB)** | Media | Alta | Las consultas MongoDB tienen una estructura más flexible y dinámica que el SQL relacional, lo que hace que la definición de "sintaxis correcta" sea más difusa y difícil de implementar mediante reglas formales. El riesgo es que el validador MongoDB sea demasiado permisivo o demasiado restrictivo. |
| **Falta de cobertura en pruebas** | Media | Media | Si no se diseña una suite de pruebas suficientemente exhaustiva, pueden quedar casos borde sin cobertura, lo que resultaría en comportamientos inesperados del sistema ante consultas inusuales o complejas. |
| **Incompatibilidad del Monaco Editor con algunos navegadores** | Baja | Media | Aunque Monaco Editor tiene soporte amplio para navegadores modernos, puede presentar comportamientos inconsistentes en versiones antiguas de los mismos, afectando la experiencia de usuario en ciertos entornos. |

---

## **2.2 Estrategias de Mitigación**

Para cada uno de los riesgos identificados, el equipo de desarrollo ha definido estrategias concretas de mitigación que reducen la probabilidad de ocurrencia o el impacto en caso de que el riesgo se materialice.

**Para la dependencia de librerías externas:**
Se realizará una evaluación preliminar exhaustiva de la librería `node-sql-parser`, incluyendo la revisión de su historial de actualizaciones, la cantidad de problemas abiertos en su repositorio, y la calidad de su documentación. Adicionalmente, se diseñará el módulo de validación de forma desacoplada, de modo que en caso de necesitar migrar a otra librería, el cambio sea mínimamente invasivo sobre el resto del sistema.

**Para las diferencias entre dialectos SQL:**
Se realizarán pruebas específicas con casos de uso representativos de cada dialecto soportado. Para los dialectos que presenten mayores incompatibilidades, se documentará claramente en la interfaz cuáles son las limitaciones conocidas, estableciendo expectativas realistas para el usuario.

**Para los problemas de rendimiento:**
Se implementará un mecanismo de debounce en el frontend que retrase la solicitud de validación hasta que el usuario haya dejado de escribir por al menos 500 milisegundos. Adicionalmente, se optimizará el backend para que el tiempo de respuesta promedio sea inferior a 200 milisegundos para consultas de longitud normal.

**Para la escalabilidad:**
En el contexto académico actual del proyecto, la carga de usuarios esperada es reducida y manejable por una instancia única del servidor. A futuro, la arquitectura basada en una API REST sin estado (stateless) facilita la escalabilidad horizontal mediante la adición de más instancias del servidor detrás de un balanceador de carga.

**Para la complejidad de la validación NoSQL:**
Se definirán claramente los casos de validación soportados para MongoDB, priorizando los más comunes y útiles para los usuarios objetivos (operaciones CRUD básicas, operadores de comparación y lógicos, estructura de pipelines de agregación). Los casos más complejos o inusuales serán documentados como limitaciones conocidas de la versión actual.

**Para la falta de cobertura en pruebas:**
Se elaborará un plan de pruebas que incluya casos de prueba positivos (consultas válidas que deben ser aceptadas), casos negativos (consultas con errores que deben ser rechazadas), y casos borde (consultas inusuales que podrían generar comportamientos inesperados).

---

# **3. Análisis de la Situación Actual**

## **3.1 Problema Identificado**

En la actualidad, el proceso más habitual mediante el cual desarrolladores, administradores de bases de datos y estudiantes verifican la corrección de sus consultas SQL o NoSQL consiste en escribirlas directamente en el cliente o interfaz del sistema gestor de bases de datos (DBMS) de su elección —ya sea MySQL Workbench, pgAdmin, SQL Server Management Studio, MongoDB Compass, o similares— y ejecutarlas directamente contra una base de datos real o de prueba.

Esta práctica, aunque funcional, presenta múltiples inconvenientes que se detallan a continuación:

**Consumo innecesario de recursos del servidor de base de datos:** Cada vez que se ejecuta una consulta en un DBMS, aunque sea solo para verificar su sintaxis, el servidor debe procesar la solicitud, lo que implica el uso de ciclos de CPU, memoria y potencialmente operaciones de entrada/salida en disco. En entornos de desarrollo o producción con recursos limitados, este comportamiento puede degradar el rendimiento general del sistema.

**Mensajes de error poco descriptivos e inconsistentes:** Los mensajes de error que generan los distintos DBMS ante errores de sintaxis varían considerablemente en calidad, claridad y nivel de detalle. En muchos casos, especialmente para usuarios novatos, estos mensajes son difíciles de interpretar y no proveen suficiente orientación para corregir el error de forma eficiente. Por ejemplo, mensajes como "ERROR 1064 (42000): You have an error in your SQL syntax" en MySQL, sin una indicación clara del problema específico, pueden resultar frustrantes y consumir tiempo valioso.

**Riesgos asociados a la ejecución en entornos reales:** En entornos de producción, ejecutar consultas mal formadas puede tener consecuencias más graves que un simple mensaje de error. Una sentencia `DELETE` o `UPDATE` sin cláusula `WHERE` por olvido, por ejemplo, puede modificar o eliminar grandes volúmenes de datos irrecuperablemente. Contar con una herramienta de validación previa reduce significativamente la probabilidad de estos accidentes.

**Dependencia de una conexión activa a la base de datos:** Para poder validar una consulta mediante el DBMS, el usuario necesita tener acceso a una instancia activa del motor de base de datos, lo cual no siempre es posible, especialmente en contextos académicos donde los estudiantes trabajan desde sus computadoras personales sin servidores configurados localmente.

**Inexistencia de herramientas educativas especializadas:** En el ámbito de la enseñanza de bases de datos, no existen actualmente herramientas web de uso gratuito, intuitivas y enfocadas específicamente en la validación sintáctica con fines pedagógicos. Los recursos existentes son en su mayoría entornos de ejecución completa (como SQLFiddle o db-fiddle.com) que, si bien son útiles, no están optimizados para el aprendizaje de la sintaxis y no proveen la retroalimentación detallada que un estudiante en proceso de aprendizaje requiere.

---

## **3.2 Limitaciones del Enfoque Actual**

Un análisis de las herramientas y prácticas existentes revela las siguientes limitaciones principales:

- **Ausencia de validación previa independiente:** No existe en el flujo de trabajo habitual una etapa formal de validación sintáctica antes de la ejecución de una consulta. Esta validación queda implícitamente delegada al propio DBMS como parte del proceso de ejecución.

- **Baja calidad del feedback al usuario:** Los mensajes de error de la mayoría de los DBMS están orientados al desarrollador con experiencia y no están diseñados con principios de usabilidad o pedagogía en mente.

- **Dependencia de entornos de ejecución completos:** Para aprender SQL, un estudiante necesita tener instalado un DBMS completo, configurar una base de datos, crear tablas de ejemplo, y recién entonces puede practicar la escritura de consultas. Esta barrera de entrada es significativa y puede desalentar el aprendizaje.

- **Falta de soporte multi-dialecto en una sola herramienta:** Los DBMS solo validan su propio dialecto. No existe una herramienta única que permita validar consultas para múltiples motores sin necesidad de tener todos ellos instalados.

---

## **3.3 Propuesta de Solución**

Frente a la problemática identificada y las limitaciones del enfoque actual, el presente proyecto propone el desarrollo de una **herramienta web independiente de validación sintáctica** que resuelva de forma directa y eficiente los problemas descritos.

La solución propuesta se diferencia del enfoque actual en los siguientes aspectos fundamentales:

- **Validación sin ejecución real:** El sistema analiza la consulta puramente desde el punto de vista gramatical, sin necesidad de conectarse a ningún motor de base de datos real. Esto elimina el riesgo de efectos secundarios no deseados.

- **Accesibilidad web universal:** Al ser una aplicación web, el sistema es accesible desde cualquier dispositivo con un navegador moderno y conexión a internet, sin necesidad de instalar software adicional.

- **Retroalimentación pedagógica de calidad:** Los mensajes de error están diseñados para ser comprensibles por usuarios con diferentes niveles de experiencia, con descripciones claras del problema, indicación de la posición del error, y sugerencias de corrección cuando corresponda.

- **Soporte multi-dialecto en una sola interfaz:** El usuario puede seleccionar el dialecto SQL de su preferencia (MySQL, PostgreSQL, SQL Server, SQLite, Oracle) o el modo MongoDB, y el sistema ajustará automáticamente las reglas de validación.

---

# **4. Estudio de Factibilidad**

## **4.1 Factibilidad Técnica**

El análisis de factibilidad técnica tiene como objetivo determinar si el proyecto puede ser desarrollado con los recursos tecnológicos, el conocimiento y las herramientas disponibles para el equipo de desarrollo. La conclusión de este análisis es que el proyecto es **completamente viable** desde el punto de vista técnico, por las siguientes razones:

**Disponibilidad de tecnologías maduras y bien documentadas:** Todas las tecnologías seleccionadas para el desarrollo del proyecto son de código abierto, tienen comunidades activas de desarrolladores, documentación oficial completa y abundantes recursos de aprendizaje disponibles en línea. Node.js, Express.js, el Monaco Editor y `node-sql-parser` son herramientas ampliamente adoptadas en la industria con décadas de desarrollo acumulado.

**Conocimiento previo del equipo:** Los integrantes del proyecto cuentan con conocimientos previos en programación web (HTML, CSS, JavaScript), desarrollo de aplicaciones con Node.js, y conceptos fundamentales de bases de datos y SQL adquiridos durante su formación académica en la Escuela Profesional de Ingeniería de Sistemas.

**Ausencia de hardware especializado:** El proyecto no requiere de infraestructura de hardware costosa o difícil de obtener. Puede ser desarrollado y ejecutado en computadoras personales de capacidades estándar, y desplegado en servicios de hosting gratuitos como Render, Railway o Vercel para su presentación académica.

### **Herramientas y Tecnologías Utilizadas**

| Herramienta / Tecnología | Tipo | Versión Recomendada | Uso en el Proyecto |
|:-------------------------|:-----|:--------------------|:-------------------|
| **Node.js** | Plataforma de ejecución backend | 20.x LTS | Entorno de ejecución del servidor. Permite ejecutar JavaScript en el lado del servidor con alto rendimiento. |
| **Express.js** | Framework web para Node.js | 4.x | Framework para la construcción de la API REST. Simplifica la definición de rutas, middlewares y manejo de solicitudes HTTP. |
| **Monaco Editor** | Librería frontend | Última estable | Editor de código avanzado para el frontend. Proporciona resaltado de sintaxis SQL, numeración de líneas y soporte para marcado de errores. |
| **node-sql-parser** | Librería npm | Última estable | Parser de SQL que soporta múltiples dialectos. Convierte consultas SQL en AST y detecta errores sintácticos. |
| **HTML5 / CSS3 / JavaScript** | Tecnologías web frontend | Estándares actuales | Tecnologías base para la construcción de la interfaz de usuario. |
| **npm (Node Package Manager)** | Gestor de paquetes | Incluido con Node.js | Gestión de dependencias del proyecto backend. |
| **Git** | Sistema de control de versiones | 2.x | Seguimiento de cambios en el código fuente del proyecto. |
| **GitHub** | Plataforma de repositorios | — | Almacenamiento remoto del repositorio, colaboración entre integrantes y gestión de ramas de desarrollo. |
| **Visual Studio Code** | IDE de desarrollo | Última estable | Entorno de desarrollo integrado utilizado por el equipo para escribir y depurar el código del proyecto. |
| **Postman** | Herramienta de pruebas de API | Última estable | Prueba manual de los endpoints de la API REST durante el desarrollo del backend. |

---

## **4.2 Factibilidad Económica**

El análisis de factibilidad económica evalúa si el proyecto puede ser llevado a cabo dentro de los límites presupuestarios del equipo, considerando todos los costos involucrados en su desarrollo y operación durante el período académico.

Es importante destacar que, al tratarse de un proyecto académico desarrollado con herramientas de código abierto y sin necesidad de infraestructura de hardware adicional, los costos totales del proyecto son considerablemente bajos en comparación con un proyecto de software comercial de características similares.

### **4.2.1 Costos Generales**

Los costos generales son aquellos relacionados con los materiales e insumos necesarios para el desarrollo y documentación del proyecto.

| Ítem | Cantidad | Costo Unitario (S/.) | Total (S/.) | Descripción |
|:-----|:---------|:---------------------|:------------|:------------|
| Materiales de oficina (cuadernos, lapiceros) | 2 paquetes | 10.00 | 20.00 | Para tomar notas durante reuniones de diseño y planificación |
| Útiles varios (post-its, marcadores) | 4 unidades | 2.00 | 8.00 | Para actividades de diseño en pizarra y organización de tareas |
| Impresión y empastado del informe final | 1 juego | 80.00 | 80.00 | Impresión a color del informe de factibilidad y documentación técnica |
| Servicio de internet (cuota mensual por integrante) | 1 mes | 50.00 | 50.00 | Acceso a internet para investigación, descarga de herramientas y trabajo remoto colaborativo |
| Almacenamiento en la nube (Google Drive o similar) | 1 mes | 25.00 | 25.00 | Espacio adicional para almacenamiento de archivos del proyecto, backups y documentos compartidos |
| **TOTAL COSTOS GENERALES** | | | **183.00** | |

### **4.2.2 Costos Operativos**

Los costos operativos son aquellos en los que se incurre durante el proceso de desarrollo del proyecto como consecuencia de las actividades del equipo.

| Concepto | Costo (S/.) | Descripción Detallada |
|:---------|:------------|:----------------------|
| Consumo de energía eléctrica | 40.00 | Costo estimado del consumo eléctrico de las computadoras personales de ambos integrantes durante las horas de trabajo en el proyecto a lo largo de las 4 semanas |
| Servicio de internet adicional | 50.00 | Consumo de datos para videollamadas de coordinación, acceso a documentación técnica y uso de herramientas colaborativas en línea |
| Transporte (movilidad) | 60.00 | Costo de transporte para las reuniones presenciales de coordinación del equipo, incluyendo reuniones de revisión con el docente |
| Alimentación durante jornadas de trabajo | 80.00 | Costo estimado de alimentación durante las sesiones de trabajo presencial prolongadas realizadas para el desarrollo del sistema |
| **TOTAL COSTOS OPERATIVOS** | **230.00** | |

### **4.2.3 Costos de Personal**

Los costos de personal representan la valorización del tiempo de trabajo de los integrantes del equipo de desarrollo. Aunque en el contexto académico no existe un pago monetario real, se realiza esta valorización para ilustrar el costo real del proyecto en términos de horas-hombre.

| Rol | Horas Trabajadas | Pago por Hora (S/.) | Total (S/.) | Actividades Principales |
|:----|:-----------------|:--------------------|:------------|:------------------------|
| Desarrollador 1 (Soto Oquendo Cristian Gabriel) — Especialista Backend | 80 horas | 8.00 | 640.00 | Diseño de la arquitectura del sistema, desarrollo del servidor Node.js con Express, implementación de la API REST, integración de la librería `node-sql-parser`, desarrollo del módulo de validación NoSQL para MongoDB, pruebas de backend, documentación técnica |
| Desarrollador 2 (Arocutipa Arocutipa Gian Franco) — Especialista Frontend | 80 horas | 8.00 | 640.00 | Diseño de la interfaz de usuario, integración del Monaco Editor, desarrollo del frontend con HTML/CSS/JavaScript, conexión del frontend con la API REST, diseño del panel de visualización de errores, pruebas de usabilidad, elaboración del informe |
| **TOTAL COSTOS DE PERSONAL** | **160 horas** | | **1,280.00** | |

### **4.2.4 Resumen Total del Proyecto**

| Tipo de Costo | Monto (S/.) | Porcentaje del Total |
|:--------------|:------------|:---------------------|
| Costos Generales | 183.00 | 10.81% |
| Costos Operativos | 230.00 | 13.58% |
| Costos de Personal | 1,280.00 | 75.61% |
| **COSTO TOTAL DEL PROYECTO** | **1,693.00** | **100%** |

El análisis de los costos revela que el **75.61% del costo total** del proyecto corresponde al costo de personal, lo cual es característico de los proyectos de desarrollo de software. Los costos de infraestructura y materiales son mínimos, lo que confirma la viabilidad económica del proyecto en el contexto académico en el que se desarrolla.

---

## **4.3 Factibilidad Operativa**

La factibilidad operativa evalúa si el sistema propuesto puede ser utilizado efectivamente por el público objetivo, teniendo en cuenta aspectos como la facilidad de acceso, la curva de aprendizaje, los requisitos de instalación y las ventajas que ofrece en la operación diaria.

**Facilidad de acceso:** Al ser una aplicación web, el sistema no requiere ningún proceso de instalación por parte del usuario. Basta con tener un navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari) y acceso a internet para utilizar el sistema. Esto elimina las barreras técnicas de instalación que suelen disuadir a usuarios menos experimentados.

**Interfaz intuitiva:** La interfaz del sistema está diseñada siguiendo principios de usabilidad web estándar. El flujo de uso es simple: escribir o pegar la consulta, seleccionar el tipo de lenguaje, y hacer clic en "Validar". Los resultados se muestran de forma clara y organizada, sin sobrecargar la interfaz con información innecesaria.

**Sin requerimientos de configuración:** A diferencia de los DBMS tradicionales, que requieren configuración de servidores, usuarios, contraseñas y bases de datos de ejemplo, el Validador de Sintaxis SQL no requiere ninguna configuración previa por parte del usuario. Es inmediatamente usable desde el primer acceso.

**Disponibilidad continua:** El sistema puede ser desplegado en plataformas de hosting gratuitas con alta disponibilidad, garantizando que los usuarios puedan acceder a él en cualquier momento, desde cualquier lugar.

### **Ventajas Operativas Detalladas**

- **Rapidez:** La validación de una consulta típica se realiza en menos de 200 milisegundos desde el momento en que el usuario activa la validación, proporcionando retroalimentación casi instantánea.

- **Seguridad:** Al no conectarse a ninguna base de datos real, el sistema no expone datos sensibles ni representa un riesgo de seguridad para la información de los usuarios o de las organizaciones.

- **Escalabilidad pedagógica:** El sistema puede ser incorporado fácilmente en el currículo del curso de Base de Datos II como herramienta de apoyo al aprendizaje, permitiendo que todos los estudiantes lo usen simultáneamente sin conflictos.

---

## **4.4 Factibilidad Legal**

Desde el punto de vista legal, el proyecto no presenta ningún impedimento para su desarrollo y distribución.

**Uso de software libre y de código abierto:** Todas las librerías y herramientas utilizadas en el proyecto (Node.js, Express.js, Monaco Editor, `node-sql-parser`) están licenciadas bajo licencias de código abierto permisivas, como MIT o Apache 2.0, que permiten su uso, modificación y distribución, incluso con fines comerciales, sin restricciones significativas.

**Desarrollo de código propio:** El código fuente del sistema es desarrollado íntegramente por los integrantes del equipo, por lo que no existen problemas de derechos de autor relacionados con el código de la aplicación.

**Sin procesamiento de datos sensibles:** El sistema no solicita, almacena ni procesa información personal de los usuarios ni datos sensibles de ningún tipo. Las consultas ingresadas por los usuarios son procesadas en memoria y no son persistidas en ninguna base de datos, por lo que no aplican regulaciones de protección de datos personales como el RGPD o la Ley N.° 29733 de Protección de Datos Personales del Perú.

---

## **4.5 Factibilidad Social**

El proyecto tiene un impacto social positivo en el contexto educativo en el que se enmarca.

**Mejora de la educación en tecnología:** La herramienta provee un recurso de aprendizaje gratuito, accesible y de alta calidad para estudiantes de informática, ingeniería de sistemas y áreas afines, contribuyendo a mejorar la calidad del proceso de enseñanza-aprendizaje de los lenguajes de consulta de bases de datos.

**Reducción de la frustración en el aprendizaje:** Uno de los principales obstáculos en el aprendizaje de SQL para estudiantes principiantes son los mensajes de error crípticos que generan los DBMS. Al proveer mensajes de error más claros y pedagógicos, el sistema reduce la frustración y facilita el proceso de comprensión y corrección de errores.

**Inclusión digital:** La accesibilidad web del sistema lo hace disponible para estudiantes que no cuentan con los recursos para instalar y configurar un DBMS en sus computadoras personales, reduciendo la brecha digital en el acceso a herramientas de aprendizaje de bases de datos.

**Fomento de buenas prácticas de desarrollo:** Al acostumbrar a los usuarios a validar sus consultas antes de ejecutarlas, el sistema promueve una cultura de desarrollo más cuidadosa y orientada a la calidad.

---

## **4.6 Factibilidad Ambiental**

El proyecto tiene un impacto ambiental mínimo y en línea con los principios de sostenibilidad tecnológica.

**Bajo consumo energético:** Al ser una aplicación web ligera, el sistema no requiere de infraestructura de servidores de alto consumo energético. Un servidor Node.js con Express es conocido por su eficiencia energética gracias al modelo de entrada/salida no bloqueante de Node.js.

**Sin generación de residuos electrónicos:** El proyecto no requiere la adquisición de hardware nuevo, por lo que no contribuye a la generación de residuos electrónicos.

**Digitalización de procesos:** Al reducir la necesidad de ejecutar consultas directamente en servidores de base de datos, el sistema puede contribuir marginalmente a la reducción del consumo de recursos computacionales en servidores de mayor consumo energético.

---

# **5. Análisis Financiero**

## **5.1 Justificación del Valor del Proyecto**

Aunque el presente proyecto es de naturaleza académica y no tiene como objetivo generar retornos financieros directos, es posible cuantificar el valor que genera en términos de beneficios tangibles e intangibles.

**Ahorro en tiempo de depuración:** Un desarrollador que utiliza el validador para verificar sus consultas antes de ejecutarlas puede ahorrar en promedio entre 5 y 15 minutos por error detectado preventivamente, al evitar los ciclos de ejecución-error-corrección en el DBMS. Para un equipo de desarrollo que escribe decenas de consultas diariamente, este ahorro puede sumar horas significativas al mes.

**Reducción de riesgos en producción:** Los errores de sintaxis que llegan a ejecutarse en entornos de producción pueden generar incidentes costosos. La implementación de una capa de validación previa puede prevenir estos incidentes, cuyo costo de resolución supera ampliamente el costo de desarrollo de la herramienta.

**Valor pedagógico:** En el contexto académico, la herramienta puede acelerar significativamente el proceso de aprendizaje de SQL, reduciendo el tiempo necesario para que un estudiante logre escribir consultas correctas de forma autónoma.

---

## **5.2 Indicadores Financieros**

Dado el carácter académico del proyecto, los indicadores financieros se presentan de forma cualitativa y estimada, orientados a ilustrar la viabilidad económica del proyecto desde una perspectiva de inversión-beneficio.

| Indicador Financiero | Resultado Estimado | Interpretación |
|:---------------------|:-------------------|:---------------|
| **Relación Beneficio/Costo (B/C)** | Mayor a 1 (B/C > 1) | El valor de los beneficios generados (ahorro de tiempo, prevención de errores, valor pedagógico) supera el costo total de desarrollo del proyecto (S/. 1,693.00), lo que indica que la inversión es justificada. |
| **Valor Actual Neto (VAN)** | Positivo (VAN > 0) | Considerando los beneficios cuantificables a lo largo del período de vida útil del sistema, el VAN del proyecto es positivo, lo que confirma que genera valor neto positivo para sus usuarios. |
| **Tasa Interna de Retorno (TIR)** | Mayor al Costo de Oportunidad del Capital (TIR > COK) | La tasa de retorno implícita del proyecto, en términos de valor generado por unidad de inversión, supera la tasa de referencia, lo que justifica la decisión de desarrollarlo frente a alternativas de uso del mismo tiempo y recursos. |

---

# **6. Conclusiones**

A partir del análisis realizado a lo largo del presente informe de factibilidad, se pueden formular las siguientes conclusiones de carácter técnico, económico, operativo y académico:

**1. El proyecto es técnicamente viable sin restricciones significativas.** La combinación de Node.js, Express.js, Monaco Editor y `node-sql-parser` provee una base tecnológica sólida, madura y bien documentada que permite implementar todas las funcionalidades planificadas dentro del plazo establecido. El equipo de desarrollo cuenta con los conocimientos técnicos necesarios para abordar el proyecto con solvencia.

**2. El costo económico total del proyecto es bajo y justificado.** Con un costo total estimado de S/. 1,693.00, el proyecto representa una inversión mínima en términos económicos, especialmente considerando que la mayor parte del costo corresponde a la valorización del tiempo de los desarrolladores. Los costos de infraestructura y herramientas son prácticamente nulos gracias al uso de tecnologías de código abierto.

**3. El impacto educativo del proyecto es alto y directamente medible.** La herramienta aborda un problema real y cotidiano en el proceso de aprendizaje de bases de datos: la falta de retroalimentación clara y accesible al momento de escribir consultas. Su implementación puede transformar positivamente la experiencia de aprendizaje de los estudiantes del curso de Base de Datos II y de otros cursos relacionados.

**4. El sistema reduce eficazmente los riesgos de errores críticos en entornos reales.** Al proveer una capa de validación previa a la ejecución de consultas, el sistema actúa como un mecanismo de control de calidad que previene la llegada de errores de sintaxis a entornos de base de datos reales, con los potenciales efectos negativos que ello puede conllevar.

**5. La arquitectura modular garantiza la escalabilidad futura del sistema.** El diseño bajo el patrón MVC y la separación clara entre el backend (API REST) y el frontend permite extender el sistema con nuevas funcionalidades y soporte para nuevos lenguajes de consulta sin necesidad de rediseñar la arquitectura existente.

**6. Se recomienda la implementación y despliegue del sistema para uso académico.** En función de los análisis de factibilidad técnica, económica, operativa, legal, social y ambiental realizados, todos los cuales arrojan resultados favorables, se concluye que el proyecto es completamente viable y se recomienda su desarrollo, despliegue y adopción como herramienta de apoyo académico en la Escuela Profesional de Ingeniería de Sistemas de la Universidad Privada de Tacna.

---

*Fin del Informe de Factibilidad — Versión 1.0*

*Universidad Privada de Tacna — Facultad de Ingeniería — Escuela Profesional de Ingeniería de Sistemas*

*Curso: Base de Datos II — Docente: Mag. Patrick Cuadros Quiroga — Año: 2026*
