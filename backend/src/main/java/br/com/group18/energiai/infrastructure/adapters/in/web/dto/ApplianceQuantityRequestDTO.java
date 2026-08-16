package br.com.group18.energiai.infrastructure.adapters.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ApplianceQuantityRequestDTO(
        @JsonProperty("appliance_id") Long applianceId, @JsonProperty("quantity") Integer quantity) {}
