package com.example.server.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/chat")
public class ChatController {

    
    @Value("${llm.base-url:http://localhost:11434}")
    private String llmBaseUrl;

    
    @Value("${llm.model:qwen3:32b}")
    private String llmModel;

    private static final String SYSTEM_PROMPT = """
        You are the Budget Bridge assistant, a friendly financial helper embedded
        in a personal-budget web app. Answer the user's questions about their
        finances using the page context and structured financial data provided
        below. Be concise, specific, and cite exact numbers when they are
        available. If the user asks for a budget recommendation, give concrete,
        actionable advice based on their actual income, spending, and category
        breakdowns. If the requested information is not in the context, say so
        plainly instead of guessing. Format responses in short paragraphs or
        short bullet lists. Do not include <think> tags or meta commentary.
        """;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE,
                 produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> chat(@RequestBody ChatRequest request) {
        String prompt = buildPrompt(request);

        Map<String, Object> ollamaPayload = new HashMap<>();
        ollamaPayload.put("model", llmModel);
        ollamaPayload.put("prompt", prompt);
        ollamaPayload.put("system", SYSTEM_PROMPT);
        ollamaPayload.put("stream", false);

        RestClient client = RestClient.builder()
                .baseUrl(llmBaseUrl)
                .build();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> raw = client.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ollamaPayload)
                    .retrieve()
                    .body(Map.class);

            String reply = raw != null && raw.get("response") != null
                    ? raw.get("response").toString()
                    : "";
            // Strip any <think>...</think> blocks that reasoning models sometimes emit.
            reply = reply.replaceAll("(?s)<think>.*?</think>", "").trim();

            Map<String, Object> out = new HashMap<>();
            out.put("reply", reply);
            out.put("model", llmModel);
            return out;
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("reply", "Sorry, I couldn't reach the AI service right now. "
                    + "Please try again in a moment.");
            err.put("error", e.getMessage());
            return err;
        }
    }

    private String buildPrompt(ChatRequest req) {
        StringBuilder sb = new StringBuilder();

        if (req.pageContext() != null && !req.pageContext().isBlank()) {
            sb.append("=== CURRENT PAGE CONTEXT ===\n");
            // Cap DOM context so we don't blow up the prompt.
            String dom = req.pageContext();
            if (dom.length() > 4000) {
                dom = dom.substring(0, 4000) + "...[truncated]";
            }
            sb.append(dom).append("\n\n");
        }

        if (req.financialData() != null && !req.financialData().isBlank()) {
            sb.append("=== FINANCIAL DATA (JSON) ===\n");
            sb.append(req.financialData()).append("\n\n");
        }

        sb.append("=== USER QUESTION ===\n");
        sb.append(req.message() == null ? "" : req.message());
        return sb.toString();
    }

    /** Request body from the frontend. */
    public record ChatRequest(
            String message,
            String pageContext,
            String financialData
    ) {}
}
