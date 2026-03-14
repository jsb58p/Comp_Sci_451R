package com.example.server.controller;

import com.example.server.dto.AiChatRequest;
import com.example.server.dto.AiResponse;
import com.example.server.model.User;
import com.example.server.service.DashboardDataService;
import com.example.server.service.LocalAiService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/ai")
public class DashboardAiController {

    private final DashboardDataService dashboardDataService;
    private final LocalAiService localAiService;

    public DashboardAiController(DashboardDataService dashboardDataService, LocalAiService localAiService) {
        this.dashboardDataService = dashboardDataService;
        this.localAiService = localAiService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(HttpSession session) {
        User user = dashboardDataService.getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Map<String, Object> dashboardData = dashboardDataService.buildDashboardData(user);
        try {
            return ResponseEntity.ok(new AiResponse(localAiService.generateDashboardSummary(dashboardData)));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody AiChatRequest request, HttpSession session) {
        User user = dashboardDataService.getSessionUser(session);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (request == null || request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message is required."));
        }

        Map<String, Object> dashboardData = dashboardDataService.buildDashboardData(user);
        try {
            String content = localAiService.answerDashboardQuestion(dashboardData, request.history(), request.message());
            return ResponseEntity.ok(new AiResponse(content));
        } catch (IllegalStateException exception) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", exception.getMessage()));
        }
    }
}
