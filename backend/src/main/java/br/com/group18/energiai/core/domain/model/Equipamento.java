package br.com.group18.energiai.core.domain.model;

/** Residential appliances persisted in {@code tb_appliance}. */
public enum Equipamento {
    LAMPADAS(CategoriaEquipamento.ILUMINACAO),
    GELADEIRA(CategoriaEquipamento.REFRIGERACAO),
    VENTILADOR(CategoriaEquipamento.CLIMATIZACAO),
    AR_CONDICIONADO(CategoriaEquipamento.CLIMATIZACAO),
    MICRO_ONDAS(CategoriaEquipamento.ELETRODOMESTICOS),
    AIR_FRYER(CategoriaEquipamento.ELETRODOMESTICOS),
    MAQUINA_DE_LAVAR(CategoriaEquipamento.ELETRODOMESTICOS),
    SECADORA(CategoriaEquipamento.ELETRODOMESTICOS),
    CHUVEIRO_ELETRICO(CategoriaEquipamento.ELETRODOMESTICOS),
    COMPUTADORES(CategoriaEquipamento.TECNOLOGIA),
    VIDEOGAME(CategoriaEquipamento.TECNOLOGIA),
    TV(CategoriaEquipamento.TECNOLOGIA);

    private final CategoriaEquipamento categoria;

    Equipamento(CategoriaEquipamento categoria) {
        this.categoria = categoria;
    }

    public CategoriaEquipamento getCategoria() {
        return categoria;
    }
}
