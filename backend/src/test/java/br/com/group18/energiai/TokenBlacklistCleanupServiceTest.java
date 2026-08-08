package br.com.group18.energiai;

import static org.mockito.Mockito.verify;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.config.TokenBlacklistCleanupService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistCleanupServiceTest {

    @Mock
    private TokenBlacklistRepositoryPort blacklistRepository;

    @InjectMocks
    private TokenBlacklistCleanupService cleanupService;

    @Test
    void shouldDeleteExpiredTokensWhenCleanupRuns() {
        cleanupService.cleanup();

        verify(blacklistRepository).deleteExpired();
    }
}
