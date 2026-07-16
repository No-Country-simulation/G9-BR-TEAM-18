package br.com.group18.energiai.infrastructure.adapters.in.web.controllers;

import br.com.group18.energiai.application.services.AutenticacaoService;
import br.com.group18.energiai.core.domain.model.Usuario;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.CadastroRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginRequestDTO;
import br.com.group18.energiai.infrastructure.adapters.in.web.dto.LoginResponseDTO;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AutenticacaoService autenticacaoService;

    // Simple in-memory session store: token -> userId
    private static final ConcurrentHashMap<String, Long> SESSIONS = new ConcurrentHashMap<>();

    public AuthController(AutenticacaoService autenticacaoService) {
        this.autenticacaoService = autenticacaoService;
    }

    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@Valid @RequestBody CadastroRequestDTO request,
                                       HttpServletResponse response) {
        try {
            Usuario usuario = autenticacaoService.cadastrar(
                    request.getNome(), request.getEmail(), request.getSenha()
            );
            criarSessao(usuario, response);
            return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(usuario));
        } catch (IllegalArgumentException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("mensagem", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request,
                                   HttpServletResponse response) {
        var usuarioOpt = autenticacaoService.login(request.getEmail(), request.getSenha());
        if (usuarioOpt.isEmpty()) {
            Map<String, Object> body = new HashMap<>();
            body.put("mensagem", "E-mail ou senha inválidos");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }

        Usuario usuario = usuarioOpt.get();
        criarSessao(usuario, response);
        return ResponseEntity.ok(toResponse(usuario));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = extrairToken(request);
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
        String token = extrairToken(request);
        if (token == null || !SESSIONS.containsKey(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = SESSIONS.get(token);
        return autenticacaoService.buscarPorId(userId)
                .map(u -> ResponseEntity.ok(toResponse(u)))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    public static Long obterUsuarioId(HttpServletRequest request) {
        String token = extrairToken(request);
        if (token != null) {
            return SESSIONS.get(token);
        }
        return null;
    }

    private void criarSessao(Usuario usuario, HttpServletResponse response) {
        String token = UUID.randomUUID().toString();
        SESSIONS.put(token, usuario.getId());

        Cookie cookie = new Cookie("SESSION_TOKEN", token);
        cookie.setPath("/");
        cookie.setMaxAge(86400 * 7); // 7 days
        cookie.setSecure(false); // Allow HTTP for local dev
        response.addCookie(cookie);
    }

    private static String extrairToken(HttpServletRequest request) {
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

    private LoginResponseDTO toResponse(Usuario usuario) {
        return new LoginResponseDTO(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }
}
