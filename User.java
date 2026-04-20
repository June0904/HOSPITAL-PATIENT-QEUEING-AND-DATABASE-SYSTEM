package backend.model;

public class User {
    private final String username;
    private final String password;
    private final String role; // "patient", "queue_manager", "doctor"

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public boolean authenticate(String password) {
        return this.password.equals(password);
    }
}