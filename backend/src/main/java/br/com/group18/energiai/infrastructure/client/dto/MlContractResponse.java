package br.com.group18.energiai.infrastructure.client.dto;

import java.util.List;

public record MlContractResponse(
        List<String> propertyTypes, List<String> efficiencyCategories, List<String> consumptionCategories) {}
