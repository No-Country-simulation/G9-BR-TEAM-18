package br.com.group18.energiai.infrastructure.config;

import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    static final String USER_ID_ATTR = "auth.userId";

    private final JwtService jwtService;
    private final TokenBlacklistRepositoryPort blacklistRepository;

    public JwtAuthFilter(JwtService jwtService, TokenBlacklistRepositoryPort blacklistRepository) {
        this.jwtService = jwtService;
        this.blacklistRepository = blacklistRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = extractToken(request);
        Long userId = null;
        if (token != null) {
            String tokenHash = jwtService.hashToken(token);
            if (!blacklistRepository.existsByTokenHash(tokenHash)) {
                userId = jwtService.validateAndGetUserId(token);
                if (userId != null) {
                    request.setAttribute(USER_ID_ATTR, userId);
                }
            }
        }
        log.debug(
                "JwtAuthFilter path={} token={} userId={}",
                request.getRequestURI(),
                token != null ? "present" : "absent",
                userId);
        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("SESSION_TOKEN".equals(c.getName())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }
}
