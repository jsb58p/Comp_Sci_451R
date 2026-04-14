package com.example.server.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LlmHealthController {

    private static final String OLLAMA_BASE_URL = "http://100.109.2.71:11434";

    @GetMapping("/llm-health")
    public Map<String, Object> checkLlmHealth() {
        Map<String, Object> result = new HashMap<>();

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            // Test 1: Check if Ollama is reachable
            HttpRequest tagsRequest = HttpRequest.newBuilder()
                    .uri(URI.create(OLLAMA_BASE_URL + "/api/tags"))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> tagsResponse = client.send(
                    tagsRequest, HttpResponse.BodyHandlers.ofString());

            result.put("connection", "SUCCESS");
            result.put("statusCode", tagsResponse.statusCode());
            result.put("availableModels", tagsResponse.body());

            // Test 2: Send a simple prompt to verify generation works
            String testPayload = """
                    {
                        "model": "qwen3:32b",
                        "prompt": "Say hello in one sentence.",
                        "stream": false
                    }
                    """;

            HttpRequest generateRequest = HttpRequest.newBuilder()
                    .uri(URI.create(OLLAMA_BASE_URL + "/api/generate"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(testPayload))
                    .build();

            HttpResponse<String> generateResponse = client.send(
                    generateRequest, HttpResponse.BodyHandlers.ofString());

            result.put("generation", "SUCCESS");
            result.put("generationStatusCode", generateResponse.statusCode());
            result.put("generationResponse", generateResponse.body());

        } catch (java.net.ConnectException e) {
            result.put("connection", "FAILED");
            result.put("error", "Connection refused - Tailscale tunnel may not be active");
            result.put("details", e.getMessage());
        } catch (java.net.http.HttpTimeoutException e) {
            result.put("connection", "FAILED");
            result.put("error", "Request timed out - LLM server may be down");
            result.put("details", e.getMessage());
        } catch (Exception e) {
            result.put("connection", "FAILED");
            result.put("error", e.getClass().getSimpleName());
            result.put("details", e.getMessage());
        }

        return result;
    }
}
