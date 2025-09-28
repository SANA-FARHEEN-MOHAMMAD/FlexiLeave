package com.sana.leave_management.controller;

import com.sana.leave_management.model.User;
import com.sana.leave_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.sana.leave_management.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    // Signup
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            User createdUser = userService.signup(user);
            return ResponseEntity.ok(Map.of(
                    "message", "Signup successful. Please enter OTP.",
                    "email", createdUser.getEmail(),
                    "role", createdUser.getRole()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Verify OTP
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String result = userService.verifyOtp(email, otp);
        if (result.startsWith("Email verified")) {
            return ResponseEntity.ok(Map.of("message", result));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", result));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String result = userService.resendOtp(email);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // forgot password -> send OTP
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        try {
            String res = userService.forgotPassword(email);
            return ResponseEntity.ok(Map.of("message", res));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // verify forgot-password OTP
    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<?> verifyForgot(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String res = userService.verifyForgotPasswordOtp(email, otp);
        if (res.equals("OTP verified")) return ResponseEntity.ok(Map.of("message", res));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", res));
    }

    // change password using otp (email + otp + newPassword)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");
        String res = userService.changePasswordWithOtp(email, otp, newPassword);
        if (res.equals("Password changed successfully")) return ResponseEntity.ok(Map.of("message", res));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", res));
    }

    // update profile (name/gender/age) — email immutable
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            String name = (String) body.get("name");
            String gender = (String) body.getOrDefault("gender", null);
            Integer age = null;
            if (body.get("age") != null) age = Integer.parseInt(body.get("age").toString());
            User updated = userService.updateProfile(email, name, gender, age);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Login — returns user object (without password) for frontend to store
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        try {
            Optional<User> uOpt = userService.login(email, password);
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                // mask/hide password before returning
                u.setPassword(null);
                return ResponseEntity.ok(u);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials or email not verified"));
            }
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }
    }

    @Autowired
private UserRepository userRepository;

@GetMapping("/{randomId}")
public ResponseEntity<?> getUserByRandomId(@PathVariable int randomId) {
    Optional<User> uOpt = userRepository.findByRandomId(randomId);
    if (uOpt.isPresent()) return ResponseEntity.ok(uOpt.get());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
}

@GetMapping("/search")
public ResponseEntity<?> searchUsers(@RequestParam String term) {
    List<User> users = userService.search(term);
    return ResponseEntity.ok(users);
}



}
