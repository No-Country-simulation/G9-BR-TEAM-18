package br.com.group18.energiai.core.domain.model;

/** Property persisted in {@code tb_property}. */
public class Property {

    private Long id;
    private Long userId;
    private String alias;
    private String propertyType;
    private boolean active;

    public Property() {}

    public Property(Long userId, String alias, String propertyType) {
        this.userId = userId;
        this.alias = alias;
        this.propertyType = propertyType;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getPropertyType() {
        return propertyType;
    }

    public void setPropertyType(String propertyType) {
        this.propertyType = propertyType;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
