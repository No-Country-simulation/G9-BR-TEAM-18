package br.com.group18.energiai;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import br.com.group18.energiai.infrastructure.client.MlSchemaDiscovery;
import br.com.group18.energiai.infrastructure.client.MlSchemaRegistry;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class MlSchemaDiscoveryTest {

    @Mock
    private MlServiceClient mlServiceClient;

    // Usamos o @Spy para vigiar a classe real e passamos a lista padrão exigida no construtor
    @Spy
    private MlSchemaRegistry registry = new MlSchemaRegistry(List.of("EXCELENTE", "BOM", "MEDIANO", "RUIM", "CRITICO"));

    @InjectMocks
    private MlSchemaDiscovery discovery;

    private ApplicationArguments mockArgs;

    @BeforeEach
    void setUp() {
        mockArgs = mock(ApplicationArguments.class);
    }

    @Test
    void deveSalvarDadosNoRegistryQuandoMlServiceResponderComSucesso() {
        // 1. Prepara os dados simulados (Mocks) que viriam do Python
        MlContractResponse mockContract = new MlContractResponse(
                List.of("CASA_NA_ARVORE"), // Tipo de imóvel inventado para provar que está dinâmico
                List.of("A", "B", "C"),
                List.of("ILUMINACAO_FUTURISTA"));

        MlApplianceCatalogResponse mockCatalog =
                new MlApplianceCatalogResponse(List.of(new MlApplianceDTO("Sabre de Luz", "TECNOLOGIA", 50, 2.0)));

        // 2. Ensina o cliente a retornar sucesso (Mono.just)
        when(mlServiceClient.fetchContract()).thenReturn(Mono.just(mockContract));
        when(mlServiceClient.fetchApplianceCatalog()).thenReturn(Mono.just(mockCatalog));

        // 3. Executa o método que roda no Startup
        discovery.run(mockArgs);

        // 4. Valida se o Registry absorveu os dados corretos
        assertEquals(1, registry.getPropertyTypes().size());
        assertEquals("CASA_NA_ARVORE", registry.getPropertyTypes().get(0));

        assertEquals(1, registry.getApplianceCatalog().size());
        assertEquals("Sabre de Luz", registry.getApplianceCatalog().get(0).name());

        // Garante que o fallback não foi chamado
        verify(registry, never()).loadDefaultValues();
    }

    @Test
    void deveCarregarFallbackEAgendarRetryQuandoMlServiceFalharNoStartup() {
        // 1. Ensina o cliente a disparar um Erro (simulando API fora do ar)
        when(mlServiceClient.fetchContract()).thenReturn(Mono.error(new RuntimeException("Connection Refused")));
        when(mlServiceClient.fetchApplianceCatalog())
                .thenReturn(Mono.error(new RuntimeException("Connection Refused")));

        // 2. Executa o método que roda no Startup
        discovery.run(mockArgs);

        // 3. Validações
        // Verifica se o método de fallback foi acionado exatamente 1 vez
        verify(registry, times(1)).loadDefaultValues();

        // Verifica se o sistema se protegeu e carregou a lista padrão (da ADR-0027)
        assertTrue(registry.getPropertyTypes().contains("RESIDENCIAL"));
        assertTrue(registry.getPropertyTypes().contains("COMERCIAL"));

        assertFalse(registry.getApplianceCatalog().isEmpty());
        assertEquals("Geladeira", registry.getApplianceCatalog().get(0).name());
    }
}
