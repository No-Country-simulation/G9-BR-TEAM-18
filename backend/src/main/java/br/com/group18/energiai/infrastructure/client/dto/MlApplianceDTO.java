package br.com.group18.energiai.infrastructure.client.dto;

public record MlApplianceDTO(
        String name,
        String mlCategory,
        Integer watts,
        Double hours
) {}