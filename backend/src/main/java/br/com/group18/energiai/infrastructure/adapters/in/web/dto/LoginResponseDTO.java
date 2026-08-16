package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Dados do usuário retornados após autenticação")
public class LoginResponseDTO {

    @Schema(description = "Identificador único do usuário", example = "1")
    private Long id;

    @Schema(description = "Nome completo do usuário", example = "João Silva")
    private String name;

    @Schema(description = "E-mail do usuário", example = "usuario@exemplo.com")
    private String email;

    @Schema(
            description = "Token JWT de sessão (também enviado via cookie SESSION_TOKEN). "
                    + "Incluído no corpo para facilitar testes fora do navegador (ex: curl, Postman). "
                    + "Ausente em respostas que não criam sessão (ex: GET /auth/me).",
            example = "eyJhbGciOiJIUzM4NiJ9...")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String token;

    @Schema(description = "Indica se o usuário precisa redefinir a senha", example = "false")
    private boolean passwordResetRequired;

    @Schema(description = "Meta de consumo mensal em kWh", example = "250.00")
    private BigDecimal consumptionGoal;

    @Schema(description = "Regularidade da análise", example = "instantanea")
    private String regularity;

    @Schema(description = "Indica se o usuário faz uso de energia no horário de pico (18h às 21h)", example = "true")
    @JsonProperty("peak_hour_usage")
    private Boolean peakHourUsage;

    @Schema(description = "Quantidade de horas de alto consumo diário", example = "4.5")
    @JsonProperty("high_consumption_hours")
    private BigDecimal highConsumptionHours;

    @Schema(description = "Provedor de autenticação (LOCAL ou GOOGLE)", example = "LOCAL")
    @JsonProperty("auth_provider")
    private String authProvider;

    public LoginResponseDTO() {}

    public LoginResponseDTO(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public boolean isPasswordResetRequired() {
        return passwordResetRequired;
    }

    public void setPasswordResetRequired(boolean passwordResetRequired) {
        this.passwordResetRequired = passwordResetRequired;
    }

    public BigDecimal getConsumptionGoal() {
        return consumptionGoal;
    }

    public void setConsumptionGoal(BigDecimal consumptionGoal) {
        this.consumptionGoal = consumptionGoal;
    }

    public String getRegularity() {
        return regularity;
    }

    public void setRegularity(String regularity) {
        this.regularity = regularity;
    }

    public Boolean getPeakHourUsage() {
        return peakHourUsage;
    }

    public void setPeakHourUsage(Boolean peakHourUsage) {
        this.peakHourUsage = peakHourUsage;
    }

    public BigDecimal getHighConsumptionHours() {
        return highConsumptionHours;
    }

    public void setHighConsumptionHours(BigDecimal highConsumptionHours) {
        this.highConsumptionHours = highConsumptionHours;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }
}
