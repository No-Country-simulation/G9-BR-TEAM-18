package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Dados para redefinição de senha por administrador")
public class AdminResetPasswordRequestDTO {

    @NotBlank
    @Size(min = 6, max = 255)
    @Schema(description = "Nova senha para o usuário", example = "novaSenha789", minLength = 6, maxLength = 255)
    private String newPassword;

    public AdminResetPasswordRequestDTO() {}

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
