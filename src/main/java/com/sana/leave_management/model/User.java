package com.sana.leave_management.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "users")
public class User {
    @Id
    private String id; // MongoDB internal ID
    private String name;
    private String email;
    private String password;
    private String role; // EMPLOYEE or MANAGER
    private int randomId; // fixed 4-digit ID generated at signup, visible everywhere

    private boolean verified = false;
    private String otp;
    private Date otpExpiry;

    // optional fields (only if user edits profile)
    private String gender; // optional
    private Integer age;   // optional

    public User() {}

    public User(String name, String email, String password, String role, int randomId) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.randomId = randomId;
    }

    // Getters and setters...
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getRandomId() { return randomId; }
    public void setRandomId(int randomId) { this.randomId = randomId; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public Date getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(Date otpExpiry) { this.otpExpiry = otpExpiry; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
