package br.com.group18.energiai.core.ports.out;

import br.com.group18.energiai.core.domain.model.ApplianceCatalogItem;
import java.util.List;

public interface MlContractPort {
    List<String> propertyTypes();

    List<String> efficiencyCategories();

    List<String> consumptionCategories();

    List<ApplianceCatalogItem> applianceCatalog();
}
