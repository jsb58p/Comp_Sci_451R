package com.example.server.controller;

import com.example.server.dto.ForgotPasswordRequest;
import com.example.server.model.User;
import com.example.server.repository.UserRepository;
import com.example.server.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ProfileController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    private User getSessionUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return null;
        return userRepository.findByUsername(username).orElse(null);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        return ResponseEntity.ok(Map.of(
                "name", user.getUsername(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "accountType", "Standard",
                "status", "Active",
                "joinDate", "Member",
                "darkMode", user.isDarkMode()
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String newUsername = body.get("username");
        String newEmail = body.get("email");

        if (newUsername != null && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Username already taken."));
            }
            user.setUsername(newUsername);
            session.setAttribute("username", newUsername);
        }

        if (newEmail != null && !newEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.ok(Map.of("success", false, "message", "Email already in use."));
            }
            user.setEmail(newEmail);
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated."));
    }

    @PostMapping("/profile/send-password-reset")
    public ResponseEntity<?> sendPasswordReset(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            ForgotPasswordRequest request = new ForgotPasswordRequest();
            request.setEmail(user.getEmail());
            userService.forgotPassword(request);
            return ResponseEntity.ok(Map.of("success", true, "message", "Password reset email sent."));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Failed to send email. Please try again later."));
        }
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody Map<String, Object> body, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (body.containsKey("darkMode")) {
            user.setDarkMode(Boolean.TRUE.equals(body.get("darkMode")));
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of("success", true));
    }
}
