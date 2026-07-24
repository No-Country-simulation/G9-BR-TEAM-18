package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminResetPasswordRequestDTO {

    @NotBlank
    @Size(min = 6, max = 255)
    private String newPassword;

    public AdminResetPasswordRequestDTO() {}

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
