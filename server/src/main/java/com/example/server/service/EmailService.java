package com.example.server.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String token) {
        String link = "http://localhost:8080/api/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Verify your account");
        message.setText("Click the link below to verify your account:\n\n" + link + "\n\nThis link expires in 24 hours.");
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = "http://localhost:5173/Comp_Sci_451R/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Reset your password");
        message.setText("Click the link below to reset your password:\n\n" + link + "\n\nThis link expires in 1 hour.");
        mailSender.send(message);
    }
}