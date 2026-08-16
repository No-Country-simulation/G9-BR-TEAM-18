package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.com.group18.energiai.infrastructure.config.JwtService;
import java.util.Date;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String TEST_SECRET = "my-test-secret-key-that-is-at-least-32-chars!!";
    private static final long EXPIRATION_MS = 3600000L;

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    void shouldCreateAndValidateToken() {
        Long userId = 42L;

        String token = jwtService.createToken(userId);
        assertNotNull(token);

        Long extractedId = jwtService.validateAndGetUserId(token);
        assertEquals(userId, extractedId);
    }

    @Test
    void shouldReturnNullForInvalidToken() {
        Long result = jwtService.validateAndGetUserId("invalid.jwt.token");

        assertNull(result);
    }

    @Test
    void shouldReturnNullForMalformedToken() {
        Long result = jwtService.validateAndGetUserId("not-a-jwt-at-all");

        assertNull(result);
    }

    @Test
    void shouldReturnExpirationDateFromValidToken() {
        String token = jwtService.createToken(1L);

        Date expiration = jwtService.getExpiration(token);

        assertNotNull(expiration);
        long now = System.currentTimeMillis();
        assertTrue(expiration.getTime() > now);
        assertTrue(expiration.getTime() <= now + EXPIRATION_MS + 1000);
    }

    @Test
    void shouldReturnNullForExpirationOfInvalidToken() {
        Date result = jwtService.getExpiration("invalid.token.here");

        assertNull(result);
    }

    @Test
    void shouldHashTokenToHexString() {
        String token = "some.jwt.token.string";

        String hash = jwtService.hashToken(token);

        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertTrue(hash.matches("[0-9a-f]{64}"));
    }

    @Test
    void shouldHashDeterministically() {
        String token = "same.token.input";

        String hash1 = jwtService.hashToken(token);
        String hash2 = jwtService.hashToken(token);

        assertEquals(hash1, hash2);
    }

    @Test
    void shouldProduceDifferentHashesForDifferentTokens() {
        String hash1 = jwtService.hashToken("token.one");
        String hash2 = jwtService.hashToken("token.two");

        assertTrue(!hash1.equals(hash2));
    }
}
