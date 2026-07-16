package br.com.group18.energiai.core.domain.model;

import java.util.List;

/**
 * Enum de aparelhos elétricos comuns mapeados para as categorias do ML Service.
 * Cada aparelho possui:
 * - nomeExibicao: nome legível em português
 * - categoriaML: categoria para o campo categoria_maior_consumo (7 categorias)
 * - campoDistribuicao: campo no distribuicao_consumo_diario (4 campos) ou NONE
 * - potenciaWatts: potência típica em watts
 * - horasUsoDia: horas médias de uso por dia
 * - icone: emoji representativo
 */
public enum ApplianceType {

    // ========== REFRIGERAÇÃO ==========
    GELADEIRA("Geladeira", "Refrigeracao", "REFRIGERACAO_WATTS", 150, 24, "🧊"),
    FREEZER("Freezer", "Refrigeracao", "REFRIGERACAO_WATTS", 200, 24, "❄️"),
    FRIGOBAR("Frigobar", "Refrigeracao", "REFRIGERACAO_WATTS", 80, 24, "🥤"),
    BEBEDOURO("Bebedouro", "Refrigeracao", "REFRIGERACAO_WATTS", 100, 12, "🚰"),

    // ========== CLIMATIZAÇÃO ==========
    AR_CONDICIONADO("Ar-condicionado", "Climatizacao", "CLIMATIZACAO_WATTS", 1500, 8, "❄️"),
    AR_CONDICIONADO_SPLIT("Ar-condicionado Split", "Climatizacao", "CLIMATIZACAO_WATTS", 1200, 8, "💨"),
    VENTILADOR("Ventilador", "Climatizacao", "CLIMATIZACAO_WATTS", 100, 8, "🌀"),
    VENTILADOR_TETO("Ventilador de teto", "Climatizacao", "CLIMATIZACAO_WATTS", 60, 8, "🔄"),
    AQUECEDOR_ELETRICO("Aquecedor elétrico", "Climatizacao", "CLIMATIZACAO_WATTS", 1500, 4, "🔥"),

    // ========== AQUECIMENTO ==========
    CHUVEIRO_ELETRICO("Chuveiro elétrico", "Eletrodomesticos", "AQUECIMENTO_WATTS", 5500, 0.5, "🚿"),
    TORNEIRA_ELETRICA("Torneira elétrica", "Eletrodomesticos", "AQUECIMENTO_WATTS", 3000, 1, "🚰"),
    AQUE_CENTRAL("Aquecedor central", "Servicos", "AQUECIMENTO_WATTS", 4000, 4, "🔥"),
    BOILER("Boiler elétrico", "Servicos", "AQUECIMENTO_WATTS", 2000, 6, "🫖"),

    // ========== ILUMINAÇÃO ==========
    LAMPADA_LED("Lâmpada LED", "Iluminacao", "ILUMINACAO_WATTS", 12, 6, "💡"),
    LAMPADA_FLUOR("Lâmpada fluorescente", "Iluminacao", "ILUMINACAO_WATTS", 30, 6, "🕯️"),
    LAMPADA_INCAND("Lâmpada incandescente", "Iluminacao", "ILUMINACAO_WATTS", 60, 6, "💡"),
    LUSTRE("Lustre / luminária", "Iluminacao", "ILUMINACAO_WATTS", 100, 5, "💎"),
    ABAT_JOUR("Abajur", "Iluminacao", "ILUMINACAO_WATTS", 40, 4, "🪔"),
    SPOT_LED("Spot LED embutido", "Iluminacao", "ILUMINACAO_WATTS", 8, 6, "✨"),

    // ========== TECNOLOGIA ==========
    TV("Televisão", "Tecnologia", "NONE", 150, 6, "📺"),
    TV_OLED("Televisão OLED", "Tecnologia", "NONE", 200, 6, "🖥️"),
    COMPUTADOR("Computador desktop", "Tecnologia", "NONE", 250, 8, "🖥️"),
    NOTEBOOK("Notebook", "Tecnologia", "NONE", 65, 8, "💻"),
    MONITOR("Monitor", "Tecnologia", "NONE", 50, 8, "🖥️"),
    ROTEADOR("Roteador Wi-Fi", "Tecnologia", "NONE", 15, 24, "📡"),
    VIDEO_GAME("Videogame", "Tecnologia", "NONE", 200, 4, "🎮"),
    CAIXA_SOM("Caixa de som", "Tecnologia", "NONE", 100, 3, "🔊"),
    SOUNDBAR("Soundbar", "Tecnologia", "NONE", 80, 4, "🔉"),
    CARREGADOR("Carregador (smartphone/tablet)", "Tecnologia", "NONE", 15, 6, "🔌"),

    // ========== ELETRODOMÉSTICOS ==========
    MAQUINA_LAVAR("Máquina de lavar", "Eletrodomesticos", "NONE", 500, 1.5, "🧺"),
    SECADORA("Secadora de roupas", "Eletrodomesticos", "NONE", 3000, 1, "🧺"),
    LAVA_LOUCAS("Lava-louças", "Eletrodomesticos", "NONE", 1500, 1.5, "🍽️"),
    MICROONDAS("Micro-ondas", "Eletrodomesticos", "NONE", 1200, 0.5, "🍕"),
    FORNO_ELETRICO("Forno elétrico", "Eletrodomesticos", "NONE", 2000, 1, "🍳"),
    FOGao_ELETRICO("Fogão elétrico", "Eletrodomesticos", "NONE", 3000, 1, "👨‍🍳"),
    AIR_FRYER("Air fryer", "Eletrodomesticos", "NONE", 1500, 0.75, "🍟"),
    CAFETEIRA("Cafeteira elétrica", "Eletrodomesticos", "NONE", 800, 0.5, "☕"),
    FERRO_PASSAR("Ferro de passar", "Eletrodomesticos", "NONE", 1000, 1, "👕"),
    ASPIRADOR_PO("Aspirador de pó", "Eletrodomesticos", "NONE", 1000, 0.5, "🧹"),
    SECADOR_CABELO("Secador de cabelo", "Eletrodomesticos", "NONE", 1500, 0.25, "💇"),
    LIQUIDIFICADOR("Liquidificador", "Eletrodomesticos", "NONE", 400, 0.25, "🥤"),
    BATEDEIRA("Batedeira", "Eletrodomesticos", "NONE", 300, 0.5, "🎂"),
    EXAUSTOR("Exaustor / coifa", "Eletrodomesticos", "NONE", 250, 2, "💨"),
    MAQUINA_COSTURA("Máquina de costura", "Eletrodomesticos", "NONE", 100, 2, "🧵"),

    // ========== SERVIÇOS ==========
    BOMBA_AGUA("Bomba d'água", "Servicos", "NONE", 500, 4, "💧"),
    PORTAO_ELETRICO("Portão elétrico", "Servicos", "NONE", 250, 0.5, "🚪"),
    INTERFONE("Interfone / porteiro", "Servicos", "NONE", 10, 24, "📞"),
    CANCELA_ELETRICA("Cancela elétrica", "Servicos", "NONE", 500, 0.5, "🚧"),
    MOTOR_PISCINA("Motor de piscina", "Servicos", "NONE", 750, 6, "🏊"),
    SISTEMA_SEG("Sistema de segurança / CFTV", "Servicos", "NONE", 50, 24, "📹"),
    SENSOR_PRESENCA("Sensor de presença", "Servicos", "NONE", 5, 24, "👁️"),
    CERCAS_ELETRICAS("Cercas elétricas", "Servicos", "NONE", 30, 24, "⚡"),

    // ========== OUTROS ==========
    OUTRO("Outro aparelho", "Outros", "NONE", 100, 2, "🔌"),
    ;

    private final String nomeExibicao;
    private final String categoriaML;
    private final String campoDistribuicao;
    private final double potenciaWatts;
    private final double horasUsoDia;
    private final String icone;

    ApplianceType(String nomeExibicao, String categoriaML, String campoDistribuicao,
                  double potenciaWatts, double horasUsoDia, String icone) {
        this.nomeExibicao = nomeExibicao;
        this.categoriaML = categoriaML;
        this.campoDistribuicao = campoDistribuicao;
        this.potenciaWatts = potenciaWatts;
        this.horasUsoDia = horasUsoDia;
        this.icone = icone;
    }

    public String getNomeExibicao() { return nomeExibicao; }
    public String getCategoriaML() { return categoriaML; }
    public String getCampoDistribuicao() { return campoDistribuicao; }
    public double getPotenciaWatts() { return potenciaWatts; }
    public double getHorasUsoDia() { return horasUsoDia; }
    public String getIcone() { return icone; }

    /** Todas as categorias distintas para o ML Service */
    public static List<String> getCategoriasML() {
        return List.of("Refrigeracao", "Climatizacao", "Tecnologia", "Iluminacao",
                       "Eletrodomesticos", "Servicos", "Outros");
    }

    /** Campos de distribuição de potência */
    public static List<String> getCamposDistribuicao() {
        return List.of("REFRIGERACAO_WATTS", "AQUECIMENTO_WATTS", "CLIMATIZACAO_WATTS", "ILUMINACAO_WATTS");
    }
}
