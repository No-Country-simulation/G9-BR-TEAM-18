package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AdminResetPasswordRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.RegisterRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.ResetPasswordRequestDTO;
import br.com.group18.energiai.infrastructure.config.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String USER_ID_ATTR = "auth.userId";

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final TokenBlacklistRepositoryPort blacklistRepository;
    private final int sessionMaxAge;
    private final boolean sessionSecure;

    public AuthController(
            AuthenticationService authenticationService,
            JwtService jwtService,
            TokenBlacklistRepositoryPort blacklistRepository,
            @Value("${SESSION_MAX_AGE_SECONDS:604800}") int sessionMaxAge,
            @Value("${SESSION_SECURE:false}") boolean sessionSecure) {
        this.authenticationService = authenticationService;
        this.jwtService = jwtService;
        this.blacklistRepository = blacklistRepository;
        this.sessionMaxAge = sessionMaxAge;
        this.sessionSecure = sessionSecure;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request, HttpServletResponse response) {
        try {
            User user = authenticationService.register(request.getName(), request.getEmail(), request.getPassword());
            createSession(user, response);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
        } catch (IllegalArgumentException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request, HttpServletResponse response) {
        var userOpt = authenticationService.login(request.getEmail(), request.getPassword());
        if (userOpt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", "E-mail ou senha inválidos");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        User user = userOpt.get();
        createSession(user, response);
        return ResponseEntity.ok(toResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extractToken(request);
        if (token != null) {
            Date expiration = jwtService.getExpiration(token);
            if (expiration != null) {
                String tokenHash = jwtService.hashToken(token);
                blacklistRepository.save(
                        tokenHash,
                        expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            }
        }
        Cookie cookie = new Cookie("SESSION_TOKEN", "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setSecure(sessionSecure);
        cookie.setAttribute("SameSite", sessionSecure ? "None" : "Lax");
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        Long userId = getUserId(servletRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            User user =
                    authenticationService.resetPassword(userId, request.getCurrentPassword(), request.getNewPassword());
            createSession(user, servletResponse);
            return ResponseEntity.ok(toResponse(user));
        } catch (IllegalArgumentException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
        }
    }

    @PostMapping("/admin/reset-password/{userId}")
    public ResponseEntity<?> adminResetPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequestDTO request,
            HttpServletResponse servletResponse) {
        try {
            User user = authenticationService.adminResetPassword(userId, request.getNewPassword());
            createSession(user, servletResponse);
            return ResponseEntity.ok(toResponse(user));
        } catch (IllegalArgumentException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Long userId = getUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return authenticationService
                .findById(userId)
                .map(u -> ResponseEntity.ok(toResponse(u)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    public static Long getUserId(HttpServletRequest request) {
        Object attr = request.getAttribute(USER_ID_ATTR);
        if (attr instanceof Long) {
            return (Long) attr;
        }
        return null;
    }

    private void createSession(User user, HttpServletResponse response) {
        String token = jwtService.createToken(user.getId());

        Cookie cookie = new Cookie("SESSION_TOKEN", token);
        cookie.setPath("/");
        cookie.setMaxAge(sessionMaxAge);
        cookie.setSecure(sessionSecure);
        cookie.setAttribute("SameSite", sessionSecure ? "None" : "Lax");
        response.addCookie(cookie);
    }

    private LoginResponseDTO toResponse(User user) {
        LoginResponseDTO dto = new LoginResponseDTO(user.getId(), user.getName(), user.getEmail());
        dto.setPasswordResetRequired(user.isPasswordResetRequired());
        return dto;
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
