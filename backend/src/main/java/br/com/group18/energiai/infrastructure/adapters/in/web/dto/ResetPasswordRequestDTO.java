package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para redefinição da própria senha")
public class ResetPasswordRequestDTO {

    @NotBlank
    @Schema(description = "Senha atual do usuário (para confirmação de identidade)", example = "senhaAtual123")
    private String currentPassword;

    @NotBlank
    @Size(min = 6, max = 255)
    @Schema(description = "Nova senha desejada", example = "novaSenha456", minLength = 6, maxLength = 255)
    private String newPassword;

    public ResetPasswordRequestDTO() {}

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
