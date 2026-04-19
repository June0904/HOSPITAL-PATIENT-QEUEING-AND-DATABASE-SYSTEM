package backend.repository;

import backend.model.patient;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class PatientRepository {
    private final List<patient> patients = new ArrayList<>();

    public void add(patient p) {
        patients.add(p);
    }

    public List<patient> findAll() {
        return new ArrayList<>(patients);
    }

    public Optional<patient> findById(String id) {
        return patients.stream()
                .filter(p -> p.getId().equals(id))
                .findFirst();
    }

    public List<patient> searchByName(String name) {
        return patients.stream()
                .filter(p -> p.getName().toLowerCase().contains(name.toLowerCase()))
                .collect(Collectors.toList());
    }

    public void update(patient updatedPatient) {
        findById(updatedPatient.getId()).ifPresent(existing -> {
            existing.setBalance(updatedPatient.getBalance());
            existing.setDiagnosis(updatedPatient.getDiagnosis());
            existing.setPrescription(updatedPatient.getPrescription());
            existing.addHistory("Updated: " + java.time.LocalDateTime.now());
        });
    }
}
