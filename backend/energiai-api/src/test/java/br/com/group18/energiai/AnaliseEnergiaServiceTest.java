package br.com.group18.energiai;

import br.com.group18.energiai.application.services.AnaliseEnergiaService;
import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AnaliseEnergiaServiceTest {

    private AnaliseEnergiaService service;

    @BeforeEach
    void setUp() {
        AnaliseRepositoryPort repo = new AnaliseRepositoryPort() {
            private AnaliseEnergia saved;
            @Override
            public AnaliseEnergia salvar(AnaliseEnergia analise) { this.saved = analise; return analise; }
            @Override
            public java.util.List<AnaliseEnergia> listarTodas() { return java.util.List.of(saved); }
        };
        service = new AnaliseEnergiaService(repo);
    }

    @Test
    void deveClassificarComoEficiente() {
        AnaliseEnergia r = service.executar(100.0, false, 5, "Casa", 2.0);
        assertEquals("EFICIENTE", r.getCategoria());
    }

    @Test
    void deveClassificarComoModerado() {
        AnaliseEnergia r = service.executar(200.0, false, 5, "Casa", 2.0);
        assertEquals("MODERADO", r.getCategoria());
    }

    @Test
    void deveClassificarComoAlto() {
        AnaliseEnergia r = service.executar(400.0, false, 5, "Casa", 2.0);
        assertEquals("ALTO", r.getCategoria());
    }

    @Test
    void deveClassificarComoAltoQuandoHorasAltas() {
        AnaliseEnergia r = service.executar(200.0, false, 5, "Casa", 8.0);
        assertEquals("ALTO", r.getCategoria());
    }

    @Test
    void deveCalcularCustoEstimado() {
        AnaliseEnergia r = service.executar(200.0, false, 5, "Casa", 3.0);
        assertEquals(150.0, r.getCustoEstimadoMensal(), 0.01);
    }

    @Test
    void deveIncluirRecomendacaoHorarioPico() {
        AnaliseEnergia r = service.executar(200.0, true, 5, "Casa", 3.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("horários de pico")));
    }

    @Test
    void deveIncluirRecomendacaoConsumoAlto() {
        AnaliseEnergia r = service.executar(350.0, false, 5, "Casa", 3.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("equipamentos antigos")));
    }

    @Test
    void deveIncluirRecomendacaoMuitosEquipamentos() {
        AnaliseEnergia r = service.executar(200.0, false, 15, "Casa", 3.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("todos os equipamentos")));
    }

    @Test
    void deveIncluirRecomendacaoHorasAltas() {
        AnaliseEnergia r = service.executar(200.0, false, 5, "Casa", 6.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("Distribua")));
    }

    @Test
    void recomendacaoPadraoQuandoNenhumaCondicaoAtendida() {
        AnaliseEnergia r = service.executar(100.0, false, 3, "Casa", 2.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("bom acompanhamento")));
    }

    @Test
    void deveRetornarProbabilidadeAltaParaConsumoAlto() {
        AnaliseEnergia r = service.executar(400.0, false, 5, "Casa", 3.0);
        assertEquals(0.85, r.getProbabilidade(), 0.01);
    }
}
