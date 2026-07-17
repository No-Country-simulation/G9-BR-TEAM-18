package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.AuthenticationService;
import br.com.group18.energiai.core.domain.model.User;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginResponseDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.RegisterRequestDTO;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthenticationService authenticationService;
  private final int sessionMaxAge;
  private final boolean sessionSecure;

  private static final ConcurrentHashMap<String, Long> SESSIONS = new ConcurrentHashMap<>();

  public AuthController(
      AuthenticationService authenticationService,
      @Value("${SESSION_MAX_AGE_SECONDS:604800}") int sessionMaxAge,
      @Value("${SESSION_SECURE:false}") boolean sessionSecure) {
    this.authenticationService = authenticationService;
    this.sessionMaxAge = sessionMaxAge;
    this.sessionSecure = sessionSecure;
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(
      @Valid @RequestBody RegisterRequestDTO request, HttpServletResponse response) {
    try {
      User user =
          authenticationService.register(
              request.getName(), request.getEmail(), request.getPassword());
      createSession(user, response);
      return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(user));
    } catch (IllegalArgumentException e) {
      Map<String, Object> body = new HashMap<>();
      body.put("message", e.getMessage());
      return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody LoginRequestDTO request, HttpServletResponse response) {
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
      SESSIONS.remove(token);
    }
    Cookie cookie = new Cookie("SESSION_TOKEN", "");
    cookie.setPath("/");
    cookie.setMaxAge(0);
    cookie.setHttpOnly(true);
    response.addCookie(cookie);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(HttpServletRequest request) {
    String token = extractToken(request);
    if (token == null || !SESSIONS.containsKey(token)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    Long userId = SESSIONS.get(token);
    return authenticationService
        .findById(userId)
        .map(u -> ResponseEntity.ok(toResponse(u)))
        .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
  }

  public static Long getUserId(HttpServletRequest request) {
    String token = extractToken(request);
    if (token != null) {
      return SESSIONS.get(token);
    }
    return null;
  }

  private void createSession(User user, HttpServletResponse response) {
    String token = UUID.randomUUID().toString();
    SESSIONS.put(token, user.getId());

    Cookie cookie = new Cookie("SESSION_TOKEN", token);
    cookie.setPath("/");
    cookie.setMaxAge(sessionMaxAge);
    cookie.setSecure(sessionSecure);
    response.addCookie(cookie);
  }

  private static String extractToken(HttpServletRequest request) {
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

  private LoginResponseDTO toResponse(User user) {
    return new LoginResponseDTO(user.getId(), user.getName(), user.getEmail());
  }
}
