package com.example.server.controller;

import com.example.server.dto.AuthResponse;
import com.example.server.dto.ForgotPasswordRequest;
import com.example.server.dto.LoginRequest;
import com.example.server.dto.RegisterRequest;
import com.example.server.dto.ResetPasswordRequest;
import com.example.server.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = userService.register(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpSession session) {
        AuthResponse response = userService.login(request);
        if (response.isSuccess() && response.getUsername() != null) {
            session.setAttribute("username", response.getUsername());
        }
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.UNAUTHORIZED;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verify(@RequestParam String token) {
        AuthResponse response = userService.verifyEmail(token);
        String redirect = response.isSuccess()
                ? frontendUrl + "/?verified=true"
                : frontendUrl + "/?verified=false";
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", redirect)
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        AuthResponse response = userService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        AuthResponse response = userService.resetPassword(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }
}