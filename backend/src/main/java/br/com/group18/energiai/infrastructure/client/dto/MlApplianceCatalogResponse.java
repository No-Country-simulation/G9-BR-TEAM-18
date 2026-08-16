package br.com.group18.energiai.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record MlApplianceCatalogResponse(@JsonProperty("appliances") List<MlApplianceDTO> appliances) {}
