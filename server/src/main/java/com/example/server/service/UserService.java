package com.example.server.service;

import com.example.server.dto.AuthResponse;
import com.example.server.dto.LoginRequest;
import com.example.server.dto.RegisterRequest;
import com.example.server.model.User;
import com.example.server.model.VerificationToken;
import com.example.server.repository.UserRepository;
import com.example.server.repository.VerificationTokenRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository,
                       VerificationTokenRepository tokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    private String validatePassword(String password) {
        if (password.length() < 8)
            return "Password must be at least 8 characters.";
        if (!password.matches(".*[0-9].*"))
            return "Password must contain at least one number.";
        if (!password.matches(".*[a-z].*"))
            return "Password must contain at least one lowercase letter.";
        if (!password.matches(".*[^a-zA-Z0-9].*"))
            return "Password must contain at least one special character.";
        return null;
    }

    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return new AuthResponse(false, "Passwords do not match", null);
        }
        String passwordError = validatePassword(request.getPassword());
        if (passwordError != null) {
            return new AuthResponse(false, passwordError, null);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse(false, "Username already taken", null);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(false, "Email already registered", null);
        }

        String hashed = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getUsername(), request.getEmail(), hashed);
        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken vt = new VerificationToken(token, user, LocalDateTime.now().plusHours(24));
        tokenRepository.save(vt);

        emailService.sendVerificationEmail(user.getEmail(), token);

        return new AuthResponse(true, "Check your email to verify your account.", null);
    }

    public AuthResponse verifyEmail(String token) {
        Optional<VerificationToken> vtOpt = tokenRepository.findByToken(token);
        if (vtOpt.isEmpty()) {
            return new AuthResponse(false, "Invalid verification link.", null);
        }

        VerificationToken vt = vtOpt.get();
        if (vt.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(vt);
            return new AuthResponse(false, "Verification link has expired.", null);
        }

        User user = vt.getUser();
        user.setVerified(true);
        userRepository.save(user);
        tokenRepository.delete(vt);

        return new AuthResponse(true, "Email verified! You can now log in.", user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsernameOrEmail());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmail(request.getUsernameOrEmail());
        }
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return new AuthResponse(false, "Invalid credentials", null);
        }
        if (!userOpt.get().isVerified()) {
            return new AuthResponse(false, "Please verify your email before logging in.", null);
        }

        return new AuthResponse(true, "Login successful", userOpt.get().getUsername());
    }
}