package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApplianceResponseDTO(
        Long id, String name, @JsonProperty("ml_category") String mlCategory, Integer watts, Double hours) {}
