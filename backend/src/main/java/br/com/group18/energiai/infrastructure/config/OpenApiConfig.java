package br.com.group18.energiai.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EnergIAI API")
                        .description("API de Análise de Eficiência Energética residencial e comercial. "
                                + "Permite gerenciar propriedades, eletrodomésticos e realizar análises "
                                + "energéticas com suporte de Machine Learning.\n\n"
                                + "## Autenticação\n\n"
                                + "A API utiliza autenticação por **cookie de sessão JWT** (`SESSION_TOKEN`).\n"
                                + "1. Faça `POST /auth/register` ou `POST /auth/login` para obter o cookie\n"
                                + "2. O Swagger UI enviará automaticamente o cookie nas requisições\n\n"
                                + "## Formato de Erros\n\n"
                                + "Erros seguem o formato:\n"
                                + "```json\n"
                                + "{\n"
                                + "  \"message\": \"Descrição do erro\",\n"
                                + "  \"fields\": {\n"
                                + "    \"campo\": \"Mensagem de validação\"\n"
                                + "  }\n"
                                + "}\n"
                                + "```")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Equipe G9-BR-TEAM-18")
                                .email("team@g9-br-team-18.com")
                                .url("https://github.com/G9-BR-TEAM-18"))
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
                .addServersItem(new Server().url("http://localhost:8080").description("Servidor de Desenvolvimento"))
                .components(new Components()
                        .addSecuritySchemes(
                                "sessionCookie",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.COOKIE)
                                        .name("SESSION_TOKEN")
                                        .description("Cookie de sessão JWT. Obtido ao fazer login ou registrar-se.")))
                .tags(List.of(
                        new Tag()
                                .name("Autenticação")
                                .description("Endpoints de autenticação, registro e gerenciamento de sessão"),
                        new Tag()
                                .name("Propriedades")
                                .description(
                                        "Gerenciamento de propriedades (residencial/comercial) e seus eletrodomésticos"),
                        new Tag()
                                .name("Eletrodomésticos")
                                .description("Catálogo de eletrodomésticos disponíveis no sistema"),
                        new Tag()
                                .name("Análise Energética")
                                .description("Análises de eficiência energética, simulações e dashboard")));
    }
}
