package backend.repository;

import backend.model.queue;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class queueRepository {
    private final List<queue> queueItems = new ArrayList<>();

    public void add(queue entry) {
        queueItems.add(entry);
    }

    public List<queue> findAll() {
        return new ArrayList<>(queueItems);
    }

    public List<queue> findByService(String serviceType) {
        return queueItems.stream()
                .filter(item -> item.getServiceType().equalsIgnoreCase(serviceType))
                .collect(Collectors.toList());
    }

    public queue pollNext(String serviceType) {
        for (queue item : queueItems) {
            if (item.getServiceType().equalsIgnoreCase(serviceType) && !item.isCalled()) {
                item.setCalled(true);
                return item;
            }
        }
        return null;
    }

    public void resetService(String serviceType) {
        queueItems.removeIf(item -> item.getServiceType().equalsIgnoreCase(serviceType));
    }

    public void resetAll() {
        queueItems.clear();
    }
}
