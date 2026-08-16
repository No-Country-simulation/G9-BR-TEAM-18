package br.com.group18.energiai.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record MlContractResponse(
        @JsonProperty("property_types") List<String> propertyTypes,
        @JsonProperty("efficiency_categories") List<String> efficiencyCategories,
        @JsonProperty("consumption_categories") List<String> consumptionCategories) {}
