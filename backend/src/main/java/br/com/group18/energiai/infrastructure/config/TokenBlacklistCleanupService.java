package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TokenBlacklistCleanupService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistCleanupService.class);

    private final TokenBlacklistRepositoryPort blacklistRepository;

    public TokenBlacklistCleanupService(TokenBlacklistRepositoryPort blacklistRepository) {
        this.blacklistRepository = blacklistRepository;
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void cleanup() {
        blacklistRepository.deleteExpired();
        log.info("Cleaned up expired token blacklist entries");
    }
}
