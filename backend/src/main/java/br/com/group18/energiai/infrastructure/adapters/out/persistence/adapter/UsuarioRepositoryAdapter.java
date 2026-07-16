package br.com.group18.energiai.infrastructure.adapters.out.persistence.adapter;

import br.com.group18.energiai.core.domain.model.Usuario;
import br.com.group18.energiai.core.ports.out.UsuarioRepositoryPort;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.mapper.UsuarioMapper;
import br.com.group18.energiai.infrastructure.adapters.out.persistence.repository.UsuarioJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UsuarioRepositoryAdapter implements UsuarioRepositoryPort {

    private final UsuarioJpaRepository jpaRepository;
    private final UsuarioMapper mapper;

    public UsuarioRepositoryAdapter(UsuarioJpaRepository jpaRepository, UsuarioMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Usuario salvar(Usuario usuario) {
        var entity = mapper.toEntity(usuario);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<Usuario> buscarPorId(Long id) {
        return jpaRepository.findById(id)
                .map(mapper::toDomain);
    }
}
