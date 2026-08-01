package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import java.util.List;

public record ContractInfoResponseDTO(
        List<String> propertyTypes, List<String> consumptionCategories, List<String> efficiencyCategories) {}
