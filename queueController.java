package backend.controller;

import backend.model.patient;
import backend.model.queue;
import backend.repository.PatientRepository;
import backend.repository.UserRepository;
import backend.repository.queueRepository;
import java.util.List;
import java.util.Optional;

public class queueController {
    private final queueRepository queueRepo = new queueRepository();
    private final UserRepository userRepo = new UserRepository();
    private final PatientRepository patientRepo = new PatientRepository();

    // Queue methods
    public void addQueueItem(queue item) {
        queueRepo.add(item);
    }

    public List<queue> getQueueItems(String serviceType) {
        return queueRepo.findByService(serviceType);
    }

    public queue callNextPatient(String serviceType) {
        return queueRepo.pollNext(serviceType);
    }

    public void resetServiceQueue(String serviceType) {
        queueRepo.resetService(serviceType);
    }

    public void resetAllQueues() {
        queueRepo.resetAll();
    }

    // Authentication
    public boolean login(String username, String password) {
        return userRepo.authenticate(username, password);
    }

    public String getUserRole(String username) {
        return userRepo.getRole(username);
    }

    // Patient methods
    public void addPatient(patient p) {
        patientRepo.add(p);
    }

    public List<patient> getAllPatients() {
        return patientRepo.findAll();
    }

    public Optional<patient> getPatientById(String id) {
        return patientRepo.findById(id);
    }

    public List<patient> searchPatients(String name) {
        return patientRepo.searchByName(name);
    }

    public void updatePatient(patient p) {
        patientRepo.update(p);
    }
}
