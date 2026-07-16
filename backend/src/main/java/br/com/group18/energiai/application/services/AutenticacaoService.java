package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.Usuario;
import br.com.group18.energiai.core.ports.out.UsuarioRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
public class AutenticacaoService {

    private static final Logger log = LoggerFactory.getLogger(AutenticacaoService.class);

    private final UsuarioRepositoryPort usuarioRepository;

    public AutenticacaoService(UsuarioRepositoryPort usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Usuario cadastrar(String nome, String email, String senha) {
        if (usuarioRepository.buscarPorEmail(email).isPresent()) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        String senhaHash = hashSenha(senha);
        Usuario usuario = new Usuario(nome, email, senhaHash);
        return usuarioRepository.salvar(usuario);
    }

    public Optional<Usuario> login(String email, String senha) {
        return usuarioRepository.buscarPorEmail(email)
                .filter(u -> verificarSenha(senha, u.getSenhaHash()));
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.buscarPorId(id);
    }

    private String hashSenha(String senha) {
        try {
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[16];
            random.nextBytes(salt);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hash = md.digest(senha.getBytes());

            byte[] saltHash = new byte[salt.length + hash.length];
            System.arraycopy(salt, 0, saltHash, 0, salt.length);
            System.arraycopy(hash, 0, saltHash, salt.length, hash.length);

            return Base64.getEncoder().encodeToString(saltHash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao hash de senha", e);
        }
    }

    private boolean verificarSenha(String senha, String hashArmazenado) {
        try {
            byte[] saltHash = Base64.getDecoder().decode(hashArmazenado);
            byte[] salt = new byte[16];
            System.arraycopy(saltHash, 0, salt, 0, salt.length);

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            byte[] hash = md.digest(senha.getBytes());

            byte[] hashEsperado = new byte[hash.length];
            System.arraycopy(saltHash, salt.length, hashEsperado, 0, hash.length);

            return MessageDigest.isEqual(hash, hashEsperado);
        } catch (Exception e) {
            log.warn("Erro ao verificar senha", e);
            return false;
        }
    }
}
