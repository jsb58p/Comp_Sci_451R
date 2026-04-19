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
        You are the Budget Bridge assistant, a friendly financial helper
        embedded in a personal-budget web app. Answer the user's questions
        about their finances using the page context and structured financial
        data provided below.

        Write like you are chatting with a friend. Use plain, natural
        sentences organized into short paragraphs. Be concise and specific,
        and mention exact numbers when they are available.

        Do NOT format your answer with markdown. Do not use asterisks for
        bold (**like this**), do not use bullet points or dashes at the
        start of lines, do not use headings, and do not use numbered lists.
        Just write normal prose the way a person would speak. If you need
        to list a few items, weave them into a sentence using commas or
        the word "and".

        If the user asks for a budget recommendation, give concrete,
        actionable advice based on their actual income, spending, and
        category breakdowns. If the requested information is not in the
        context, say so plainly instead of guessing.

        Do not include <think> tags or any meta commentary about your
        reasoning process.
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
            // Strip markdown formatting so the reply reads as plain conversational text.
            reply = stripMarkdown(reply);

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

    /**
     * Removes common markdown artifacts (bold/italic asterisks, heading hashes,
     * bullet markers, horizontal rules, and inline code backticks) so the
     * reply reads as plain conversational prose in the chat UI.
     */
    private static String stripMarkdown(String text) {
        if (text == null || text.isEmpty()) return text;

        String out = text;
        // Bold and italic markers: **text**, __text__, *text*, _text_
        out = out.replaceAll("\\*\\*(.+?)\\*\\*", "$1");
        out = out.replaceAll("__(.+?)__", "$1");
        out = out.replaceAll("(?<![A-Za-z0-9])\\*(.+?)\\*(?![A-Za-z0-9])", "$1");
        out = out.replaceAll("(?<![A-Za-z0-9])_(.+?)_(?![A-Za-z0-9])", "$1");
        // Inline code: `text`
        out = out.replaceAll("`([^`]+)`", "$1");
        // Heading hashes at the start of a line
        out = out.replaceAll("(?m)^\\s{0,3}#{1,6}\\s*", "");
        // Bullet markers (- * +) at the start of a line, turned into plain text
        out = out.replaceAll("(?m)^\\s*[-*+]\\s+", "");
        // Numbered list markers (1. 2.) at the start of a line
        out = out.replaceAll("(?m)^\\s*\\d+\\.\\s+", "");
        // Horizontal rules
        out = out.replaceAll("(?m)^\\s*([-*_])\\1{2,}\\s*$", "");
        // Collapse 3+ newlines into 2
        out = out.replaceAll("\\n{3,}", "\n\n");
        return out.trim();
    }

    /** Request body from the frontend. */
    public record ChatRequest(
            String message,
            String pageContext,
            String financialData
    ) {}
}
