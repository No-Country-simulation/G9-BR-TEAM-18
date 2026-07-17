package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.User;
import java.util.Optional;

public interface UserRepositoryPort {
    User save(User user);

    Optional<User> findByEmail(String email);

    Optional<User> findById(Long id);
}
