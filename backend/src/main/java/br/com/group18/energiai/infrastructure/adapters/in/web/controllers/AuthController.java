package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.dto.UserPreferences;
import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.application.services.GoogleAuthService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.core.ports.out.TokenBlacklistRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.AdminResetPasswordRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.GoogleAuthRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.RegisterRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.ResetPasswordRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.UserPreferencesRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.security.SessionUserResolver;
import br.com.group18.energiai.infrastructure.config.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Autenticação")
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String SESSION_COOKIE_NAME = "SESSION_TOKEN";

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final TokenBlacklistRepositoryPort blacklistRepository;
    private final GoogleAuthService googleAuthService;
    private final int sessionMaxAge;
    private final boolean sessionSecure;

    public AuthController(
            AuthenticationService authenticationService,
            JwtService jwtService,
            TokenBlacklistRepositoryPort blacklistRepository,
            GoogleAuthService googleAuthService,
            @Value("${SESSION_MAX_AGE_SECONDS}") int sessionMaxAge,
            @Value("${SESSION_SECURE}") boolean sessionSecure) {
        this.authenticationService = authenticationService;
        this.jwtService = jwtService;
        this.blacklistRepository = blacklistRepository;
        this.googleAuthService = googleAuthService;
        this.sessionMaxAge = sessionMaxAge;
        this.sessionSecure = sessionSecure;
    }

    @Operation(
            summary = "Registrar novo usuário",
            description = "Cria uma nova conta e retorna os dados do usuário junto com um cookie de sessão JWT.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Usuário criado com sucesso"),
        @ApiResponse(responseCode = "409", description = "Conflito: e-mail já cadastrado no sistema")
    })
    @PostMapping("/register")
    public ResponseEntity<LoginResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request, HttpServletResponse response) {
        User user = authenticationService.register(request.getName(), request.getEmail(), request.getPassword());
        String token = createSession(user, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user, token));
    }

    @Operation(
            summary = "Autenticar usuário",
            description = "Autentica com e-mail e senha. Retorna os dados do usuário e define o cookie de sessão JWT.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "401", description = "Não autorizado: e-mail ou senha inválidos")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request, HttpServletResponse response) {
        var user = authenticationService.login(request.getEmail(), request.getPassword());
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "E-mail ou senha inválidos"));
        }
        String token = createSession(user.get(), response);
        return ResponseEntity.ok(toResponse(user.get(), token));
    }

    @Operation(
            summary = "Autenticar com Google",
            description = "Valida o ID Token do Google, cria ou autentica o usuário e define a sessão.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login ou cadastro via Google realizado com sucesso"),
        @ApiResponse(responseCode = "403", description = "Proibido: Token inválido ou expirado")
    })
    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(
            @Valid @RequestBody GoogleAuthRequestDTO request, HttpServletResponse response) {
        GoogleIdToken.Payload payload = googleAuthService.verifyToken(request.credential());
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = authenticationService.loginWithGoogle(email, name);
        String token = createSession(user, response);
        return ResponseEntity.ok(toResponse(user, token));
    }

    @Operation(
            summary = "Encerrar sessão",
            description = "Invalida o token JWT atual na blacklist e remove o cookie de sessão.")
    @ApiResponse(responseCode = "200", description = "Sessão encerrada com sucesso")
    @SecurityRequirement(name = "sessionCookie")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extractToken(request);
        if (token != null) {
            Date expiration = jwtService.getExpiration(token);
            if (expiration != null) {
                blacklistRepository.save(
                        jwtService.hashToken(token),
                        expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            }
        }
        response.addCookie(expiredSessionCookie());
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Redefinir própria senha",
            description = "Altera a senha do usuário autenticado. Requer a senha atual para confirmar a identidade.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Senha alterada com sucesso"),
        @ApiResponse(responseCode = "403", description = "Proibido: senha atual incorreta")
    })
    @SecurityRequirement(name = "sessionCookie")
    @PostMapping("/reset-password")
    public ResponseEntity<LoginResponseDTO> resetPassword(
            @Valid @RequestBody ResetPasswordRequestDTO request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        Long userId = SessionUserResolver.userId(servletRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = authenticationService.resetPassword(userId, request.getCurrentPassword(), request.getNewPassword());
        String token = createSession(user, servletResponse);
        return ResponseEntity.ok(toResponse(user, token));
    }

    @Operation(
            summary = "[Admin] Redefinir senha de outro usuário",
            description = "Permite que um administrador redefina a senha de qualquer usuário pelo ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Senha redefinida com sucesso"),
        @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
    })
    @SecurityRequirement(name = "sessionCookie")
    @PostMapping("/admin/reset-password/{userId}")
    public ResponseEntity<LoginResponseDTO> adminResetPassword(
            @PathVariable Long userId,
            @Valid @RequestBody AdminResetPasswordRequestDTO request,
            HttpServletResponse servletResponse) {
        User user = authenticationService.adminResetPassword(userId, request.getNewPassword());
        String token = createSession(user, servletResponse);
        return ResponseEntity.ok(toResponse(user, token));
    }

    @Operation(
            summary = "Obter dados do usuário atual",
            description = "Retorna os dados do usuário autenticado com base no cookie de sessão.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Dados do usuário retornados"),
        @ApiResponse(responseCode = "401", description = "Não autorizado: sessão inválida ou expirada")
    })
    @SecurityRequirement(name = "sessionCookie")
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Long userId = SessionUserResolver.userId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return authenticationService
                .findById(userId)
                .map(user -> ResponseEntity.ok(toResponse(user)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @Operation(
            summary = "Atualizar preferências do usuário",
            description = "Atualiza meta de consumo, regularidade e hábitos de consumo do usuário autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Preferências atualizadas"),
        @ApiResponse(responseCode = "401", description = "Não autorizado")
    })
    @SecurityRequirement(name = "sessionCookie")
    @PutMapping("/preferences")
    public ResponseEntity<LoginResponseDTO> updatePreferences(
            @RequestBody UserPreferencesRequestDTO request, HttpServletRequest servletRequest) {
        Long userId = SessionUserResolver.userId(servletRequest);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = authenticationService.updatePreferences(userId, toPreferences(request));
        return ResponseEntity.ok(toResponse(user));
    }

    private String createSession(User user, HttpServletResponse response) {
        String token = jwtService.createToken(user.getId());
        Cookie cookie = new Cookie(SESSION_COOKIE_NAME, token);
        cookie.setPath("/");
        cookie.setMaxAge(sessionMaxAge);
        cookie.setSecure(sessionSecure);
        cookie.setHttpOnly(true);
        cookie.setAttribute("SameSite", sessionSecure ? "None" : "Lax");
        response.addCookie(cookie);
        return token;
    }

    private Cookie expiredSessionCookie() {
        Cookie cookie = new Cookie(SESSION_COOKIE_NAME, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setSecure(sessionSecure);
        cookie.setHttpOnly(true);
        cookie.setAttribute("SameSite", sessionSecure ? "None" : "Lax");
        return cookie;
    }

    private UserPreferences toPreferences(UserPreferencesRequestDTO request) {
        return new UserPreferences(
                request.getConsumptionGoal(),
                request.getRegularity(),
                request.getPeakHourUsage(),
                request.getHighConsumptionHours());
    }

    private LoginResponseDTO toResponse(User user, String token) {
        LoginResponseDTO dto = new LoginResponseDTO(user.getId(), user.getName(), user.getEmail());
        dto.setToken(token);
        dto.setPasswordResetRequired(user.isPasswordResetRequired());
        dto.setConsumptionGoal(user.getConsumptionGoal());
        dto.setRegularity(user.getRegularity());
        dto.setPeakHourUsage(user.getPeakHourUsage());
        dto.setHighConsumptionHours(user.getHighConsumptionHours());
        dto.setAuthProvider(user.getAuthProvider());
        return dto;
    }

    private LoginResponseDTO toResponse(User user) {
        return toResponse(user, null);
    }

    private String extractToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
