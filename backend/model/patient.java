package backend.model;

import java.util.ArrayList;
import java.util.List;

public class patient {
    private String id;
    private String name;
    private int age;
    private String address;
    private double balance;
    private String diagnosis;
    private String prescription;
    private final List<String> history;

    public patient(String id, String name, int age, String address, double balance) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.address = address;
        this.balance = balance;
        this.diagnosis = "";
        this.prescription = "";
        this.history = new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public String getAddress() {
        return address;
    }

    public double getBalance() {
        return balance;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public String getPrescription() {
        return prescription;
    }

    public List<String> getHistory() {
        return new ArrayList<>(history);
    }

    public void setBalance(double balance) {
        this.balance = balance;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public void addHistory(String note) {
        this.history.add(note);
    }
}
