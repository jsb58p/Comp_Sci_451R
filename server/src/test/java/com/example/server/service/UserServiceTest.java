package com.example.server.service;

import com.example.server.dto.LoginRequest;
import com.example.server.dto.RegisterRequest;
import com.example.server.dto.AuthResponse;
import com.example.server.dto.ResetPasswordRequest;
import com.example.server.model.PasswordResetToken;
import com.example.server.model.User;
import com.example.server.model.VerificationToken;
import com.example.server.repository.PasswordResetTokenRepository;
import com.example.server.repository.UserRepository;
import com.example.server.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private VerificationTokenRepository tokenRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private EmailService emailService;

    private UserService userService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, tokenRepository, resetTokenRepository, emailService);
    }

    @Test
    void register_passwordMismatch_returnsFalse() {
        RegisterRequest req = registerRequest("user1", "user1@example.com", "Valid1!", "different");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Passwords do not match", res.getMessage());
    }

    @Test
    void register_passwordTooShort_returnsFalse() {
        RegisterRequest req = registerRequest("user1", "user1@example.com", "Ab1!", "Ab1!");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Password must be at least 8 characters.", res.getMessage());
    }

    @Test
    void register_passwordNoNumber_returnsFalse() {
        RegisterRequest req = registerRequest("user1", "user1@example.com", "abcdefg!", "abcdefg!");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Password must contain at least one number.", res.getMessage());
    }

    @Test
    void register_passwordNoSpecialChar_returnsFalse() {
        RegisterRequest req = registerRequest("user1", "user1@example.com", "abcdefg1", "abcdefg1");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Password must contain at least one special character.", res.getMessage());
    }

    @Test
    void register_usernameTaken_returnsFalse() {
        when(userRepository.existsByUsername("user1")).thenReturn(true);
        RegisterRequest req = registerRequest("user1", "user1@example.com", "Valid1!x", "Valid1!x");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Username already taken", res.getMessage());
    }

    @Test
    void register_emailTaken_returnsFalse() {
        when(userRepository.existsByUsername("user1")).thenReturn(false);
        when(userRepository.existsByEmail("user1@example.com")).thenReturn(true);
        RegisterRequest req = registerRequest("user1", "user1@example.com", "Valid1!x", "Valid1!x");
        AuthResponse res = userService.register(req);
        assertFalse(res.isSuccess());
        assertEquals("Email already registered", res.getMessage());
    }

    @Test
    void register_success_returnsTrue() throws Exception {
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.existsByEmail(any())).thenReturn(false);
        RegisterRequest req = registerRequest("user1", "user1@example.com", "Valid1!x", "Valid1!x");
        AuthResponse res = userService.register(req);
        assertTrue(res.isSuccess());
        assertEquals("Check your email to verify your account.", res.getMessage());
        verify(userRepository).save(any(User.class));
        verify(tokenRepository).save(any(VerificationToken.class));
    }

    @Test
    void login_userNotFound_returnsFalse() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());
        AuthResponse res = userService.login(loginRequest("unknown", "password"));
        assertFalse(res.isSuccess());
        assertEquals("Invalid credentials", res.getMessage());
    }

    @Test
    void login_wrongPassword_returnsFalse() {
        User user = new User("user1", "user1@example.com", encoder.encode("correctPass1!"));
        user.setVerified(true);
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        AuthResponse res = userService.login(loginRequest("user1", "wrongPass1!"));
        assertFalse(res.isSuccess());
        assertEquals("Invalid credentials", res.getMessage());
    }

    @Test
    void login_notVerified_returnsFalse() {
        User user = new User("user1", "user1@example.com", encoder.encode("Valid1!x"));
        // verified defaults to false
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        AuthResponse res = userService.login(loginRequest("user1", "Valid1!x"));
        assertFalse(res.isSuccess());
        assertEquals("Please verify your email before logging in.", res.getMessage());
    }

    @Test
    void login_success_returnsTrue() {
        User user = new User("user1", "user1@example.com", encoder.encode("Valid1!x"));
        user.setVerified(true);
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        AuthResponse res = userService.login(loginRequest("user1", "Valid1!x"));
        assertTrue(res.isSuccess());
        assertEquals("Login successful", res.getMessage());
        assertEquals("user1", res.getUsername());
    }

    @Test
    void login_byEmail_success_returnsTrue() {
        User user = new User("user1", "user1@example.com", encoder.encode("Valid1!x"));
        user.setVerified(true);
        when(userRepository.findByUsername("user1@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("user1@example.com")).thenReturn(Optional.of(user));
        AuthResponse res = userService.login(loginRequest("user1@example.com", "Valid1!x"));
        assertTrue(res.isSuccess());
        assertEquals("user1", res.getUsername());
    }

    @Test
    void verifyEmail_invalidToken_returnsFalse() {
        when(tokenRepository.findByToken("bad-token")).thenReturn(Optional.empty());
        AuthResponse res = userService.verifyEmail("bad-token");
        assertFalse(res.isSuccess());
        assertEquals("Invalid verification link.", res.getMessage());
    }

    @Test
    void verifyEmail_expiredToken_returnsFalse() {
        User user = new User("user1", "user1@example.com", "hash");
        VerificationToken vt = new VerificationToken("token", user, LocalDateTime.now().minusHours(1));
        when(tokenRepository.findByToken("token")).thenReturn(Optional.of(vt));
        AuthResponse res = userService.verifyEmail("token");
        assertFalse(res.isSuccess());
        assertEquals("Verification link has expired.", res.getMessage());
        verify(tokenRepository).delete(vt);
    }

    @Test
    void verifyEmail_success_returnsTrue() {
        User user = new User("user1", "user1@example.com", "hash");
        VerificationToken vt = new VerificationToken("token", user, LocalDateTime.now().plusHours(1));
        when(tokenRepository.findByToken("token")).thenReturn(Optional.of(vt));
        AuthResponse res = userService.verifyEmail("token");
        assertTrue(res.isSuccess());
        assertTrue(user.isVerified());
        verify(userRepository).save(user);
        verify(tokenRepository).delete(vt);
    }

    @Test
    void resetPassword_passwordMismatch_returnsFalse() {
        ResetPasswordRequest req = resetRequest("tok", "Valid1!x", "different");
        AuthResponse res = userService.resetPassword(req);
        assertFalse(res.isSuccess());
        assertEquals("Passwords do not match.", res.getMessage());
    }

    @Test
    void resetPassword_invalidToken_returnsFalse() {
        when(resetTokenRepository.findByToken("bad")).thenReturn(Optional.empty());
        ResetPasswordRequest req = resetRequest("bad", "Valid1!x", "Valid1!x");
        AuthResponse res = userService.resetPassword(req);
        assertFalse(res.isSuccess());
        assertEquals("Invalid or expired reset link.", res.getMessage());
    }

    @Test
    void resetPassword_expiredToken_returnsFalse() {
        User user = new User("user1", "user1@example.com", "hash");
        PasswordResetToken prt = new PasswordResetToken("tok", user, LocalDateTime.now().minusMinutes(1));
        when(resetTokenRepository.findByToken("tok")).thenReturn(Optional.of(prt));
        ResetPasswordRequest req = resetRequest("tok", "Valid1!x", "Valid1!x");
        AuthResponse res = userService.resetPassword(req);
        assertFalse(res.isSuccess());
        assertEquals("Reset link has expired.", res.getMessage());
        verify(resetTokenRepository).delete(prt);
    }

    @Test
    void resetPassword_success_returnsTrue() {
        User user = new User("user1", "user1@example.com", "oldhash");
        PasswordResetToken prt = new PasswordResetToken("tok", user, LocalDateTime.now().plusHours(1));
        when(resetTokenRepository.findByToken("tok")).thenReturn(Optional.of(prt));
        ResetPasswordRequest req = resetRequest("tok", "NewPass1!", "NewPass1!");
        AuthResponse res = userService.resetPassword(req);
        assertTrue(res.isSuccess());
        assertEquals("Password reset successfully. You can now log in.", res.getMessage());
        verify(userRepository).save(user);
        verify(resetTokenRepository).delete(prt);
    }

    private RegisterRequest registerRequest(String username, String email, String password, String confirm) {
        RegisterRequest r = new RegisterRequest();
        r.setUsername(username);
        r.setEmail(email);
        r.setPassword(password);
        r.setConfirmPassword(confirm);
        return r;
    }

    private LoginRequest loginRequest(String usernameOrEmail, String password) {
        LoginRequest r = new LoginRequest();
        r.setUsernameOrEmail(usernameOrEmail);
        r.setPassword(password);
        return r;
    }

    private ResetPasswordRequest resetRequest(String token, String password, String confirm) {
        ResetPasswordRequest r = new ResetPasswordRequest();
        r.setToken(token);
        r.setPassword(password);
        r.setConfirmPassword(confirm);
        return r;
    }
}