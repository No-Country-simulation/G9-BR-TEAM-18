package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.TokenBlacklistEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.TokenBlacklistJpaRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class TokenBlacklistRepositoryAdapter implements TokenBlacklistRepositoryPort {

    private final TokenBlacklistJpaRepository repository;

    public TokenBlacklistRepositoryAdapter(TokenBlacklistJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean existsByTokenHash(String tokenHash) {
        return repository.existsByTokenHashAndExpiresAtAfter(tokenHash, LocalDateTime.now());
    }

    @Override
    public void save(String tokenHash, LocalDateTime expiresAt) {
        TokenBlacklistEntity entity = new TokenBlacklistEntity();
        entity.setTokenHash(tokenHash);
        entity.setExpiresAt(expiresAt);
        repository.save(entity);
    }

    @Override
    public void deleteExpired() {
        repository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
