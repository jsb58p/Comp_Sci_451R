package com.example.server.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    @Autowired
    private Environment env;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String toEmail, String token) throws MessagingException {
        String link = env.getProperty("app.base-url") + "/api/auth/verify?token=" + token;
        String from = env.getProperty("spring.mail.username");

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
        helper.setFrom(from);
        helper.setTo(toEmail);
        helper.setSubject("Verify your Budget Bridge account");
        helper.setText(
            "<p>Click the button below to verify your account:</p>" +
            "<p><a href=\"" + link + "\" style=\"background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;\">Verify Email</a></p>" +
            "<p>Or copy and paste this link: <a href=\"" + link + "\">" + link + "</a></p>" +
            "<p>This link expires in 24 hours.</p>",
            true
        );
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String toEmail, String token) throws MessagingException {
        String link = "https://jsb58p.github.io/Comp_Sci_451R/reset-password?token=" + token;
        String from = env.getProperty("spring.mail.username");

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");
        helper.setFrom(from);
        helper.setTo(toEmail);
        helper.setSubject("Reset your Budget Bridge password");
        helper.setText(
            "<p>Click the button below to reset your password:</p>" +
            "<p><a href=\"" + link + "\" style=\"background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;\">Reset Password</a></p>" +
            "<p>Or copy and paste this link: <a href=\"" + link + "\">" + link + "</a></p>" +
            "<p>This link expires in 1 hour.</p>",
            true
        );
        mailSender.send(message);
    }
}
