package br.com.group18.energiai.core.ports.out;

import java.time.LocalDateTime;

public interface TokenBlacklistRepositoryPort {
    boolean existsByTokenHash(String tokenHash);

    void save(String tokenHash, LocalDateTime expiresAt);

    void deleteExpired();
}
