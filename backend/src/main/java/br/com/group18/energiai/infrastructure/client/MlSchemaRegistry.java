package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MlSchemaRegistry {

    private static final Logger log = LoggerFactory.getLogger(MlSchemaRegistry.class);

    // Listas volatile para thread-safety ao serem substituídas pelo WebFlux em background
    private volatile List<String> propertyTypes = List.of();
    private volatile List<String> efficiencyCategories = List.of();
    private volatile List<String> consumptionCategories = List.of();
    private volatile List<MlApplianceDTO> applianceCatalog = List.of();

    private final List<String> defaultEfficiencyCategories;

    public MlSchemaRegistry(@Value("${ML_DEFAULT_CATEGORIES}") List<String> defaultEfficiencyCategories) {
        this.defaultEfficiencyCategories = List.copyOf(defaultEfficiencyCategories);
        loadDefaultValues(); // Já inicializa com o fallback de segurança no boot
    }

    public void register(MlContractResponse contract, MlApplianceCatalogResponse catalog) {
        if (contract != null) {
            this.propertyTypes = List.copyOf(contract.propertyTypes());
            this.efficiencyCategories = List.copyOf(contract.efficiencyCategories());
            this.consumptionCategories = List.copyOf(contract.consumptionCategories());
        }

        if (catalog != null && catalog.appliances() != null) {
            this.applianceCatalog = List.copyOf(catalog.appliances());
        }

        log.info("Schema Discovery atualizado! Imóveis: {}, Eficiência: {}, Consumo: {}, Aparelhos: {}",
                this.propertyTypes.size(), this.efficiencyCategories.size(),
                this.consumptionCategories.size(), this.applianceCatalog.size());
    }

    public void loadDefaultValues() {
        log.warn("Carregando valores padrão (fallback) no MlSchemaRegistry...");

        // Valores mapeados de acordo com a ADR-0027
        this.propertyTypes = List.of("RESIDENCIAL", "APARTAMENTO", "COMERCIAL");
        this.efficiencyCategories = this.defaultEfficiencyCategories;
        this.consumptionCategories = List.of(
                "REFRIGERATION", "CLIMATE_CONTROL", "TECHNOLOGY",
                "LIGHTING", "APPLIANCES", "SERVICES", "OTHERS"
        );

        // Catálogo reduzido de segurança
        this.applianceCatalog = List.of(
                new MlApplianceDTO("Geladeira", "REFRIGERATION", 150, 24.0),
                new MlApplianceDTO("Ar-condicionado", "CLIMATE_CONTROL", 1500, 8.0),
                new MlApplianceDTO("Lâmpada", "LIGHTING", 12, 6.0),
                new MlApplianceDTO("Televisão", "TECHNOLOGY", 150, 6.0)
        );
    }

    // Getters para a aplicação usar (sempre retornam listas imutáveis)
    public List<String> getPropertyTypes() {
        return propertyTypes;
    }

    public List<String> getEfficiencyCategories() {
        return efficiencyCategories;
    }

    public List<String> getConsumptionCategories() {
        return consumptionCategories;
    }

    public List<MlApplianceDTO> getApplianceCatalog() {
        return applianceCatalog;
    }
}