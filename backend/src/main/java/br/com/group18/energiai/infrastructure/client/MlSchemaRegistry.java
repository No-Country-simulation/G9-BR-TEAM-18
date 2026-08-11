package br.com.group18.energiai.infrastructure.client;

import br.com.group18.energiai.core.domain.model.ApplianceCatalogItem;
import br.com.group18.energiai.core.ports.out.MlContractPort;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceCatalogResponse;
import br.com.group18.energiai.infrastructure.client.dto.MlApplianceDTO;
import br.com.group18.energiai.infrastructure.client.dto.MlContractResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MlSchemaRegistry implements MlContractPort {

    private static final Logger log = LoggerFactory.getLogger(MlSchemaRegistry.class);

    private volatile List<String> propertyTypes = List.of();
    private volatile List<String> efficiencyCategories = List.of();
    private volatile List<String> consumptionCategories = List.of();
    private volatile List<MlApplianceDTO> applianceCatalog = List.of();

    private final List<String> defaultEfficiencyCategories;

    public MlSchemaRegistry(@Value("${ML_DEFAULT_CATEGORIES}") List<String> defaultEfficiencyCategories) {
        this.defaultEfficiencyCategories = List.copyOf(defaultEfficiencyCategories);
        loadDefaultValues();
    }

    public void register(MlContractResponse contract, MlApplianceCatalogResponse catalog) {
        if (contract != null) {
            if (contract.propertyTypes() != null) {
                this.propertyTypes = List.copyOf(contract.propertyTypes());
            }
            if (contract.efficiencyCategories() != null) {
                this.efficiencyCategories = List.copyOf(contract.efficiencyCategories());
            }
            if (contract.consumptionCategories() != null) {
                this.consumptionCategories = List.copyOf(contract.consumptionCategories());
            }
        }

        if (catalog != null && catalog.appliances() != null) {
            this.applianceCatalog = List.copyOf(catalog.appliances());
        }

        log.info(
                "Schema Discovery atualizado! Imóveis: {}, Eficiência: {}, Consumo: {}, Aparelhos: {}",
                this.propertyTypes.size(),
                this.efficiencyCategories.size(),
                this.consumptionCategories.size(),
                this.applianceCatalog.size());
    }

    public void loadDefaultValues() {
        log.warn("Carregando valores padrão (fallback) no MlSchemaRegistry...");

        this.propertyTypes = List.of("RESIDENCIAL", "APARTAMENTO", "COMERCIAL");
        this.efficiencyCategories = this.defaultEfficiencyCategories;
        this.consumptionCategories = List.of(
                "REFRIGERATION", "CLIMATE_CONTROL", "TECHNOLOGY", "LIGHTING", "APPLIANCES", "SERVICES", "OTHERS");

        this.applianceCatalog = List.of(
                new MlApplianceDTO("Geladeira", "REFRIGERATION", 150, 24.0),
                new MlApplianceDTO("Freezer", "REFRIGERATION", 200, 24.0),
                new MlApplianceDTO("Frigobar", "REFRIGERATION", 100, 24.0),
                new MlApplianceDTO("Bebedouro", "REFRIGERATION", 90, 24.0),
                new MlApplianceDTO("Ar-condicionado", "CLIMATE_CONTROL", 1500, 8.0),
                new MlApplianceDTO("Split", "CLIMATE_CONTROL", 1200, 8.0),
                new MlApplianceDTO("Ventilador", "CLIMATE_CONTROL", 100, 8.0),
                new MlApplianceDTO("Aquecedor", "CLIMATE_CONTROL", 1500, 3.0),
                new MlApplianceDTO("Lâmpada", "LIGHTING", 12, 6.0),
                new MlApplianceDTO("Micro-ondas", "APPLIANCES", 1200, 0.5),
                new MlApplianceDTO("Air Fryer", "APPLIANCES", 1500, 0.75),
                new MlApplianceDTO("Máquina de Lavar", "APPLIANCES", 500, 1.5),
                new MlApplianceDTO("Secadora", "APPLIANCES", 2500, 1.0),
                new MlApplianceDTO("Chuveiro Elétrico", "APPLIANCES", 5500, 0.5),
                new MlApplianceDTO("Cafeteira", "APPLIANCES", 800, 0.25),
                new MlApplianceDTO("Ferro de Passar", "APPLIANCES", 1200, 0.5),
                new MlApplianceDTO("Aspirador", "APPLIANCES", 1400, 0.5),
                new MlApplianceDTO("Liquidificador", "APPLIANCES", 500, 0.25),
                new MlApplianceDTO("Batedeira", "APPLIANCES", 300, 0.25),
                new MlApplianceDTO("Forno", "APPLIANCES", 1500, 0.75),
                new MlApplianceDTO("Fogão", "APPLIANCES", 1500, 1.0),
                new MlApplianceDTO("Televisão", "TECHNOLOGY", 150, 6.0),
                new MlApplianceDTO("Computador", "TECHNOLOGY", 150, 8.0),
                new MlApplianceDTO("Notebook", "TECHNOLOGY", 65, 6.0),
                new MlApplianceDTO("Roteador", "TECHNOLOGY", 10, 24.0),
                new MlApplianceDTO("Videogame", "TECHNOLOGY", 200, 4.0),
                new MlApplianceDTO("Bomba d'Água", "SERVICES", 750, 1.0),
                new MlApplianceDTO("Portão Elétrico", "SERVICES", 250, 0.25),
                new MlApplianceDTO("Motor de Piscina", "SERVICES", 750, 4.0));
    }

    @Override
    public List<String> propertyTypes() {
        return propertyTypes;
    }

    @Override
    public List<String> efficiencyCategories() {
        return efficiencyCategories;
    }

    @Override
    public List<String> consumptionCategories() {
        return consumptionCategories;
    }

    @Override
    public List<ApplianceCatalogItem> applianceCatalog() {
        return applianceCatalog.stream()
                .map(item -> new ApplianceCatalogItem(item.name(), item.mlCategory(), item.watts(), item.hours()))
                .toList();
    }
}
