package br.com.group18.energiai.infrastructure.adapters.out.persistence;

import br.com.group18.energiai.core.domain.model.AnaliseEnergia;
import br.com.group18.energiai.core.ports.out.AnaliseRepositoryPort;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
public class InMemoryAnaliseRepository implements AnaliseRepositoryPort {

    private final ConcurrentHashMap<Long, AnaliseEnergia> store = new ConcurrentHashMap<>();
    private final AtomicLong idGen = new AtomicLong(1);

    @Override
    public AnaliseEnergia salvar(AnaliseEnergia analise) {
        long id = idGen.getAndIncrement();
        analise.setId(id);
        store.put(id, analise);
        return analise;
    }

    @Override
    public List<AnaliseEnergia> listarTodas() {
        return new ArrayList<>(store.values());
    }
}
