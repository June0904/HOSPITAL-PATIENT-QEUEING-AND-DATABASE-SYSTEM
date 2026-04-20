package backend.repository;

import backend.model.User;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserRepository {
    private final List<User> users = new ArrayList<>();

    // Initialize with some default users for demo
    public UserRepository() {
        users.add(new User("patient1", "pass", "patient"));
        users.add(new User("queue1", "pass", "queue_manager"));
        users.add(new User("doctor1", "pass", "doctor"));
    }

    public Optional<User> findByUsername(String username) {
        return users.stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst();
    }

    public boolean authenticate(String username, String password) {
        return findByUsername(username)
                .map(user -> user.authenticate(password))
                .orElse(false);
    }

    public String getRole(String username) {
        return findByUsername(username)
                .map(User::getRole)
                .orElse(null);
    }
}
