package br.com.group18.energiai.infrastructure.adapters.out.persistence.repository;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.TokenBlacklistEntity;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenBlacklistJpaRepository extends JpaRepository<TokenBlacklistEntity, Long> {

    boolean existsByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);

    void deleteByExpiresAtBefore(LocalDateTime threshold);
}
