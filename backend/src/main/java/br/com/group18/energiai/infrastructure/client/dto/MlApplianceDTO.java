package br.com.group18.energiai.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MlApplianceDTO(
        String name, @JsonProperty("ml_category") String mlCategory, Integer watts, Double hours) {}
