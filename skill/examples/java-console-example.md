# Java Console Example

Ejemplo minimo con `java.net.http.HttpClient` para consumir la Skill/API publica.

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SqlValidationClient {
  private static final String BASE_URL =
      "https://wonderful-benevolence-production-ebaf.up.railway.app";

  public static void main(String[] args) throws Exception {
    String code = "CREATE TABL empleados (id INT);";
    String json = String.format(
        "{\"engine\":\"auto\",\"code\":\"%s\"}",
        code.replace("\\", "\\\\").replace("\"", "\\\"")
    );

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/api/v1/validate"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();

    HttpClient client = HttpClient.newHttpClient();
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() >= 400) {
      throw new IllegalStateException("Validation API error: " + response.statusCode());
    }

    System.out.println(response.body());
  }
}
```

Compilar y ejecutar:

```bash
javac SqlValidationClient.java
java SqlValidationClient
```
