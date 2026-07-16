package br.com.group18.energiai.application.services;

import br.com.group18.energiai.core.domain.model.ApplianceItem;
import br.com.group18.energiai.core.domain.model.ApplianceType;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Serviço que agrega uma lista de aparelhos selecionados pelo usuário
 * nas features esperadas pelo ML Service.
 */
@Service
public class ApplianceAggregationService {

    /** Agrega os aparelhos e retorna um mapa com todas as features calculadas */
    public AggregationResult agregar(List<ApplianceItem> aparelhos) {
        if (aparelhos == null || aparelhos.isEmpty()) {
            return new AggregationResult(
                    Collections.emptyMap(),
                    "Outros",
                    Map.of("REFRIGERACAO_WATTS", 0.0, "AQUECIMENTO_WATTS", 0.0,
                           "CLIMATIZACAO_WATTS", 0.0, "ILUMINACAO_WATTS", 0.0),
                    0, 0.0
            );
        }

        // 1. Total de equipamentos
        int totalEquipamentos = aparelhos.stream()
                .mapToInt(ApplianceItem::getQuantidade)
                .sum();

        // 2. Consumo mensal estimado (kWh)
        double consumoMensalKwh = aparelhos.stream()
                .mapToDouble(ApplianceItem::getConsumoMensalKwh)
                .sum();

        // 3. Agrupar potência total por categoria ML (7 categorias)
        Map<String, Double> potenciaPorCategoriaML = new HashMap<>();
        for (String cat : ApplianceType.getCategoriasML()) {
            potenciaPorCategoriaML.put(cat, 0.0);
        }
        for (ApplianceItem item : aparelhos) {
            String cat = item.getTipo().getCategoriaML();
            double total = potenciaPorCategoriaML.getOrDefault(cat, 0.0) + item.getPotenciaTotalWatts();
            potenciaPorCategoriaML.put(cat, total);
        }

        // 4. Categoria de maior consumo (ML)
        String categoriaMaiorConsumo = Collections.max(
                potenciaPorCategoriaML.entrySet(),
                Map.Entry.comparingByValue()
        ).getKey();

        // 5. Agrupar potência total por campo de distribuição (4 campos)
        Map<String, Double> potenciaPorDistribuicao = new HashMap<>();
        potenciaPorDistribuicao.put("REFRIGERACAO_WATTS", 0.0);
        potenciaPorDistribuicao.put("AQUECIMENTO_WATTS", 0.0);
        potenciaPorDistribuicao.put("CLIMATIZACAO_WATTS", 0.0);
        potenciaPorDistribuicao.put("ILUMINACAO_WATTS", 0.0);

        for (ApplianceItem item : aparelhos) {
            String campo = item.getTipo().getCampoDistribuicao();
            if (!"NONE".equals(campo) && potenciaPorDistribuicao.containsKey(campo)) {
                double total = potenciaPorDistribuicao.get(campo) + item.getPotenciaTotalWatts();
                potenciaPorDistribuicao.put(campo, total);
            }
        }

        // 6. Mapa completo de features
        Map<String, Double> features = new HashMap<>();
        features.put("quantidade_equipamentos", (double) totalEquipamentos);
        features.put("consumo_kwh_estimado", Math.round(consumoMensalKwh * 100.0) / 100.0);
        for (Map.Entry<String, Double> entry : potenciaPorCategoriaML.entrySet()) {
            features.put("cat_potencia_" + entry.getKey().toLowerCase(), entry.getValue());
        }
        for (Map.Entry<String, Double> entry : potenciaPorDistribuicao.entrySet()) {
            features.put(entry.getKey(), entry.getValue());
        }

        return new AggregationResult(
                features,
                categoriaMaiorConsumo,
                potenciaPorDistribuicao,
                totalEquipamentos,
                Math.round(consumoMensalKwh * 100.0) / 100.0
        );
    }

    /** Resultado da agregação */
    public record AggregationResult(
            Map<String, Double> allFeatures,
            String categoriaMaiorConsumo,
            Map<String, Double> distribuicaoConsumo,
            int totalEquipamentos,
            double consumoKwhEstimado
    ) {}
}
