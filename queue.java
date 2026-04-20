package backend.model;

public class queue {
    private final String ticket;
    private final String patientId;
    private final String serviceType;
    private boolean called;

    public queue(String ticket, String patientId, String serviceType) {
        this.ticket = ticket;
        this.patientId = patientId;
        this.serviceType = serviceType;
        this.called = false;
    }

    public String getTicket() {
        return ticket;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getServiceType() {
        return serviceType;
    }

    public boolean isCalled() {
        return called;
    }

    public void setCalled(boolean called) {
        this.called = called;
    }
}
