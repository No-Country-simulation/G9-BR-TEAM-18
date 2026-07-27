package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

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

    @Schema(description = "Indica se o usuário precisa redefinir a senha", example = "false")
    private boolean passwordResetRequired;

    @Schema(description = "Meta de consumo mensal em kWh", example = "250.00")
    private BigDecimal consumptionGoal;

    @Schema(description = "Regularidade da análise", example = "instantanea")
    private String regularity;

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
}
