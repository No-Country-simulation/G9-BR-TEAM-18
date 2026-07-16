package br.com.group18.energiai;

import br.com.group18.energiai.application.services.AnaliseEnergiaService;
import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;
import br.com.group18.energiai.infrastructure.client.MlServiceClient;
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
        MlServiceClient mlClient = new MlServiceClient("http://localhost:9999");
        service = new AnaliseEnergiaService(repo, mlClient);
    }

    @Test
    void deveClassificarComoExcelente() {
        AnaliseEnergia r = service.executar(60.0, false, 3, "Casa", 1.0);
        assertEquals("EXCELENTE", r.getCategoria());
    }

    @Test
    void deveClassificarComoBom() {
        AnaliseEnergia r = service.executar(150.0, false, 5, "Casa", 2.0);
        assertEquals("BOM", r.getCategoria());
    }

    @Test
    void deveClassificarComoMediano() {
        AnaliseEnergia r = service.executar(300.0, false, 8, "Casa", 4.0);
        assertEquals("MEDIANO", r.getCategoria());
    }

    @Test
    void deveClassificarComoRuim() {
        AnaliseEnergia r = service.executar(500.0, true, 12, "Casa", 6.0);
        assertEquals("RUIM", r.getCategoria());
    }

    @Test
    void deveClassificarComoCritico() {
        AnaliseEnergia r = service.executar(800.0, true, 20, "Casa", 10.0);
        assertEquals("CRITICO", r.getCategoria());
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
    void deveIncluirRecomendacaoParaRuimOuCritico() {
        AnaliseEnergia r = service.executar(600.0, false, 8, "Casa", 6.0);
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
    void recomendacaoEspecificaParaExcelente() {
        AnaliseEnergia r = service.executar(60.0, false, 2, "Casa", 1.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("boas práticas")));
    }

    @Test
    void recomendacaoPadraoQuandoNenhumaCondicaoAtendida() {
        AnaliseEnergia r = service.executar(150.0, false, 4, "Casa", 2.0);
        assertTrue(r.getRecomendacoes().stream().anyMatch(s -> s.contains("bom acompanhamento")));
    }
}
