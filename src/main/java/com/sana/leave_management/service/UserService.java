package com.sana.leave_management.service;

import com.sana.leave_management.model.User;
import com.sana.leave_management.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Map;
import java.security.SecureRandom;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;  // if mail not configured, it won’t break

    private final SecureRandom random = new SecureRandom();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    public List<User> search(String term) {
        
    int id = -1;
    try {
        id = Integer.parseInt(term); // if the term is numeric, use it for randomId
    } catch (NumberFormatException e) {
        // not a number, ignore
    }
    return userRepository.findByNameContainingIgnoreCaseOrRandomId(term, id);
    }
public void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private int generateRandomId() {
        return 1000 + random.nextInt(9000);
    }

    private String generateOtp() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    private void sendOtpEmail(String toEmail, String otp, String subject) {
        if (mailSender == null) {
            System.out.println("DEBUG: Mail not configured. OTP " + otp + " would be sent to " + toEmail);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText("Your OTP is: " + otp + "\n\nIt will expire in 5 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // signup
    public User signup(User user) {
        user.setRandomId(generateRandomId());
        user.setVerified(false);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));

        User saved = userRepository.save(user);

        sendOtpEmail(saved.getEmail(), otp, "Signup Verification OTP");
        return saved;
    }

    // verify OTP
    public String verifyOtp(String email, String otp) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            if (u.getOtp() != null && u.getOtp().equals(otp) && u.getOtpExpiry().after(new Date())) {
                u.setVerified(true);
                u.setOtp(null);
                userRepository.save(u);
                return "Email verified successfully";
            }
            return "Invalid or expired OTP";
        }
        return "User not found";
    }

    // resend OTP
    public String resendOtp(String email) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            String otp = generateOtp();
            u.setOtp(otp);
            u.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
            userRepository.save(u);

            sendOtpEmail(u.getEmail(), otp, "Resend OTP");
            return "OTP resent to email";
        }
        return "User not found";
    }

    // forgot password
    public String forgotPassword(String email) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            String otp = generateOtp();
            u.setOtp(otp);
            u.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
            userRepository.save(u);

            sendOtpEmail(u.getEmail(), otp, "Password Reset OTP");
            return "Password reset OTP sent";
        }
        return "User not found";
    }

    public String verifyForgotPasswordOtp(String email, String otp) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            if (u.getOtp() != null && u.getOtp().equals(otp) && u.getOtpExpiry().after(new Date())) {
                return "OTP verified";
            }
            return "Invalid or expired OTP";
        }
        return "User not found";
    }

    public String changePasswordWithOtp(String email, String otp, String newPassword) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isPresent()) {
            User u = uOpt.get();
            if (u.getOtp() != null && u.getOtp().equals(otp) && u.getOtpExpiry().after(new Date())) {
                String hashed = passwordEncoder.encode(newPassword);
                
                u.setPassword(hashed);
                u.setOtp(null);
                userRepository.save(u);
                return "Password changed successfully";
            }
            return "Invalid or expired OTP";
        }
        return "User not found";
    }

    // update profile
    public User updateProfile(String email, String name, String gender, Integer age) {
        Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
        if (uOpt.isEmpty()) throw new RuntimeException("User not found");

        User u = uOpt.get();
        if (name != null) u.setName(name);
        if (gender != null) u.setGender(gender);
        if (age != null) u.setAge(age);

        return userRepository.save(u);
    }

    // login
    public Optional<User> login(String email, String password) {
        return userRepository.findByEmailIgnoreCase(email).filter(u -> passwordEncoder.matches(password, u.getPassword()));
    }

    @RestController
@RequestMapping("/api/mail")
@CrossOrigin(origins = "*")
public class MailController {

    @Autowired
    private UserService userService; // you already have sendEmail logic here

    @PostMapping("/send")
    public ResponseEntity<?> sendMail(@RequestBody Map<String, String> body) {
        String to = body.get("to");
        String subject = body.get("subject");
        String message = body.get("body");
        try {
            userService.sendEmail(to, subject, message); // <-- reuse OTP mail method
            return ResponseEntity.ok(Map.of("message", "Mail sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

}
