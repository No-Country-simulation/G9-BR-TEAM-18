package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import br.com.group18.energiai.application.exception.ForbiddenOperationException;
import br.com.group18.energiai.application.services.PropertyService;
import br.com.group18.energiai.core.domain.model.Property;
import br.com.group18.energiai.core.ports.out.PropertyRepositoryPort;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PropertyServiceTest {

    @Mock
    private PropertyRepositoryPort propertyRepository;

    @InjectMocks
    private PropertyService propertyService;

    @Test
    void shouldThrowForbiddenWhenUserTriesToAccessAnotherUsersProperty() {
        Property property = new Property(1L, "Casa Praia", "Casa");
        property.setId(100L);

        when(propertyRepository.findById(100L)).thenReturn(Optional.of(property));

        ForbiddenOperationException exception =
                assertThrows(ForbiddenOperationException.class, () -> propertyService.getOwned(100L, 2L));

        assertEquals("Você não tem acesso a esta propriedade.", exception.getMessage());
    }
}
