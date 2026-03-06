package com.example.server.dto;

public class ResetPasswordRequest {
    private String token;
    private String password;
    private String confirmPassword;

    public String getToken() { return token; }
    public String getPassword() { return password; }
    public String getConfirmPassword() { return confirmPassword; }

    public void setToken(String token) { this.token = token; }
    public void setPassword(String password) { this.password = password; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}