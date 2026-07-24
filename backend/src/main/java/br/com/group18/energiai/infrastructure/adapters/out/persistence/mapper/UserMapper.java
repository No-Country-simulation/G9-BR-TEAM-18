package br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper;

import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserEntity toEntity(User domain) {
        if (domain == null) {
            return null;
        }

        UserEntity entity = new UserEntity();
        entity.setId(domain.getId());
        entity.setName(domain.getName());
        entity.setEmail(domain.getEmail());
        entity.setPasswordHash(domain.getPasswordHash());
        entity.setPasswordResetRequired(domain.isPasswordResetRequired() ? 1 : 0);
        return entity;
    }

    public User toDomain(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        User domain = new User(entity.getName(), entity.getEmail(), entity.getPasswordHash());
        domain.setId(entity.getId());
        domain.setPasswordResetRequired(Integer.valueOf(1).equals(entity.getPasswordResetRequired()));
        return domain;
    }
}
