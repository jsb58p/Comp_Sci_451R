package com.example.server.service;

import com.example.server.dto.AiChatMessage;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LocalAiService {

    private static final String LLM_BASE_URL = "http://100.109.2.71:11434";
    private static final String MODEL_NAME = "qwen3:32b";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateDashboardSummary(Map<String, Object> dashboardData) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(message("system",
                "You are a concise personal finance dashboard assistant. " +
                        "Write a short summary with practical observations based only on the provided dashboard data. " +
                        "Keep it under 120 words and avoid markdown tables."));
        messages.add(message("user", buildContextPrompt(dashboardData, "Provide a brief dashboard summary.")));
        return callModel(messages);
    }

    public String answerDashboardQuestion(Map<String, Object> dashboardData, List<AiChatMessage> history, String question) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(message("system",
                "You are a concise personal finance dashboard assistant. " +
                        "Answer based only on the provided dashboard context and chat history. " +
                        "If the data is insufficient, say so clearly."));
        messages.add(message("user", buildContextPrompt(dashboardData, "Dashboard context for this conversation.")));

        if (history != null) {
            for (AiChatMessage item : history) {
                if (item == null || item.role() == null || item.content() == null || item.content().isBlank()) {
                    continue;
                }
                messages.add(message(item.role(), item.content()));
            }
        }

        messages.add(message("user", question));
        return callModel(messages);
    }

    private String callModel(List<Map<String, String>> messages) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", MODEL_NAME);
        payload.put("stream", false);
        payload.put("messages", messages);

        try {
            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(LLM_BASE_URL + "/api/chat"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalStateException("Local AI model returned status " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root.path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.asText().isBlank()) {
                throw new IllegalStateException("Local AI model returned an empty response.");
            }
            return contentNode.asText().trim();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Unable to reach the local AI model.", e);
        }
    }

    private Map<String, String> message(String role, String content) {
        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", role);
        message.put("content", content);
        return message;
    }

    private String buildContextPrompt(Map<String, Object> dashboardData, String instruction) {
        try {
            return instruction + "\n\nDashboard data:\n" + objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(dashboardData);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to prepare dashboard context.", e);
        }
    }
}
