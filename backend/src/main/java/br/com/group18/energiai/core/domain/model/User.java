package br.com.group18.energiai.core.domain.model;

import java.math.BigDecimal;

public class User {

    private Long id;
    private String name;
    private String email;
    private String passwordHash;
    private boolean passwordResetRequired;
    private BigDecimal consumptionGoal;
    private String regularity;

    public User() {}

    public User(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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
