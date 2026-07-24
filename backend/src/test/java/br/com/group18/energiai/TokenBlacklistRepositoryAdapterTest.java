package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter.TokenBlacklistRepositoryAdapter;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.entity.TokenBlacklistEntity;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.TokenBlacklistJpaRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TokenBlacklistRepositoryAdapterTest {

    @Mock
    private TokenBlacklistJpaRepository jpaRepository;

    private TokenBlacklistRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new TokenBlacklistRepositoryAdapter(jpaRepository);
    }

    @Test
    void shouldReturnTrueWhenTokenExistsInBlacklist() {
        String tokenHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
        when(jpaRepository.existsByTokenHashAndExpiresAtAfter(anyString(), any(LocalDateTime.class)))
                .thenReturn(true);

        boolean result = adapter.existsByTokenHash(tokenHash);

        assertTrue(result);
    }

    @Test
    void shouldReturnFalseWhenTokenNotInBlacklist() {
        String tokenHash = "nonexistenthash";
        when(jpaRepository.existsByTokenHashAndExpiresAtAfter(anyString(), any(LocalDateTime.class)))
                .thenReturn(false);

        boolean result = adapter.existsByTokenHash(tokenHash);

        assertFalse(result);
    }

    @Test
    void shouldSaveTokenToBlacklist() {
        String tokenHash = "sometokenhash";
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(1);

        adapter.save(tokenHash, expiresAt);

        verify(jpaRepository).save(any(TokenBlacklistEntity.class));
    }

    @Test
    void shouldDeleteExpiredTokens() {
        adapter.deleteExpired();

        verify(jpaRepository).deleteByExpiresAtBefore(any(LocalDateTime.class));
    }

    @Test
    void shouldNotDeleteExpiredWhenNeverCalled() {
        verify(jpaRepository, never()).deleteByExpiresAtBefore(any());
    }
}
