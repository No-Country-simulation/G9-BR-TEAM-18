package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Credenciais de login do usuário")
public class LoginRequestDTO {

    @NotBlank
    @Email
    @Size(max = 255)
    @Schema(description = "E-mail do usuário", example = "usuario@exemplo.com", maxLength = 255)
    private String email;

    @NotBlank
    @Size(min = 6, max = 255)
    @Schema(description = "Senha do usuário", example = "minhaSenha123", minLength = 6, maxLength = 255)
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
