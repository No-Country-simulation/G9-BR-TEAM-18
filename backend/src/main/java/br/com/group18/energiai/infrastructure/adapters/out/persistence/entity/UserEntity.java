package br.com.group18.energiai.infrastructure.adapters.out.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_user")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "password_reset_required", nullable = false)
    private Integer passwordResetRequired = 0;

    @Column(name = "consumption_goal", precision = 10, scale = 2)
    private BigDecimal consumptionGoal;

    @Column(name = "regularity", length = 20)
    private String regularity;

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

    public Integer getPasswordResetRequired() {
        return passwordResetRequired;
    }

    public void setPasswordResetRequired(Integer passwordResetRequired) {
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
