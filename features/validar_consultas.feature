Feature: Validacion de consultas SQL y MongoDB
  Como usuario del validador
  Quiero enviar consultas SQL o MongoDB al API
  Para saber si la sintaxis es correcta o recibir sugerencias de correccion

  Scenario: Una consulta SQL correcta se marca como valida
    Given tengo la consulta SQL "SELECT id, nombre FROM empleados WHERE activo = 1;"
    When valido la consulta como "sql"
    Then el resultado debe ser valido

  Scenario: Un error tipografico en SQL se detecta y sugiere la correccion
    Given tengo la consulta SQL "SELECT nombre FORM usuarios;"
    When valido la consulta como "sql"
    Then el resultado debe ser invalido
    And el mensaje de error debe contener "FROM"

  Scenario: Una consulta MongoDB correcta se marca como valida
    Given tengo la consulta MongoDB "db.empleados.find({ activo: true });"
    When valido la consulta como "nosql"
    Then el resultado debe ser valido

  Scenario: Un operador invalido en MongoDB se detecta
    Given tengo la consulta MongoDB "db.posts.find({ vistas: { $mayorQue: 100 } })"
    When valido la consulta como "nosql"
    Then el resultado debe ser invalido

  Scenario: El endpoint de salud responde correctamente
    When consulto el endpoint de salud
    Then el servicio debe responder con estado "ok"
