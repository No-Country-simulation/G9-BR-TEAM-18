package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.Usuario;

import java.util.Optional;

public interface UsuarioRepositoryPort {
    Usuario salvar(Usuario usuario);
    Optional<Usuario> buscarPorEmail(String email);
    Optional<Usuario> buscarPorId(Long id);
}
