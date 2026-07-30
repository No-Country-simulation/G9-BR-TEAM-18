package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.retry.Retry;

@Component
public class MlSchemaDiscovery implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MlSchemaDiscovery.class);

    private final MlServiceClient mlServiceClient;
    private final MlSchemaRegistry registry;

    public MlSchemaDiscovery(MlServiceClient mlServiceClient, MlSchemaRegistry registry) {
        this.mlServiceClient = mlServiceClient;
        this.registry = registry;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Schema Discovery: Buscando contrato e catálogo no ML Service...");

        try {
            // Tenta buscar os dois endpoints em paralelo e bloqueia no startup por no máximo 10 segundos
            Tuple2<MlContractResponse, MlApplianceCatalogResponse> response = Mono.zip(
                            mlServiceClient.fetchContract(), mlServiceClient.fetchApplianceCatalog())
                    .block(Duration.ofSeconds(10));

            if (response != null) {
                registry.register(response.getT1(), response.getT2());
                log.info("Schema Discovery: Concluído com sucesso no startup.");
            }
        } catch (Exception e) {
            // Se o ML Service estiver fora, captura o erro e ativa o modo de sobrevivência
            log.warn(
                    "Schema Discovery: ML Service indisponível no startup ({}). Carregando fallback...",
                    e.getMessage());
            registry.loadDefaultValues();

            log.info("Iniciando rotina de retentativa em background para o ML Service...");
            startBackgroundRetry();
        }
    }

    private void startBackgroundRetry() {
        // Rotina 100% reativa e assíncrona. Não trava o servidor.
        Mono.zip(mlServiceClient.fetchContract(), mlServiceClient.fetchApplianceCatalog())
                .retryWhen(Retry.fixedDelay(Long.MAX_VALUE, Duration.ofSeconds(30))
                        .doBeforeRetry(retrySignal ->
                                log.debug("Retentativa em background: tentando conectar ao ML Service...")))
                .subscribe(
                        response -> {
                            log.info(
                                    "Schema Discovery: Reconexão bem-sucedida em background! Atualizando o Registry em memória.");
                            registry.register(response.getT1(), response.getT2());
                        },
                        error -> log.error("Schema Discovery: Erro fatal no retry assíncrono.", error));
    }
}
