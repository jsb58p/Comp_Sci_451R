package com.example.server.dto;

import java.util.List;

public record AiChatRequest(String message, List<AiChatMessage> history) {
}
