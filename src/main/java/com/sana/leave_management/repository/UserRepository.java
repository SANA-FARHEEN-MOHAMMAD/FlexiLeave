package com.sana.leave_management.repository;

import com.sana.leave_management.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    // Case-insensitive lookup for email
    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByNameContainingIgnoreCaseOrRandomId(String name, int randomId);

    Optional<User> findByRandomId(int randomId);
}
