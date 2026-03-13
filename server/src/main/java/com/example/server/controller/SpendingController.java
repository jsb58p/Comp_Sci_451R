package com.example.server.controller;

import com.example.server.model.Expense;
import com.example.server.model.User;
import com.example.server.repository.ExpenseRepository;
import com.example.server.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/spending")
public class SpendingController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public SpendingController(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    private User getSessionUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return null;
        return userRepository.findByUsername(username).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getExpenses(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Expense> expenses = expenseRepository.findByUserOrderByDateDesc(user);
        List<Map<String, Object>> result = expenses.stream().map(e -> Map.<String, Object>of(
                "id", e.getId(),
                "date", e.getDate().toString(),
                "category", e.getCategory(),
                "amount", e.getAmount(),
                "description", e.getDescription() != null ? e.getDescription() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> addExpense(@RequestBody Map<String, Object> body, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String dateStr = (String) body.get("date");
        String category = (String) body.get("category");
        Object amountObj = body.get("amount");
        String description = (String) body.getOrDefault("description", null);

        if (dateStr == null || category == null || amountObj == null) {
            return ResponseEntity.badRequest().body("date, category, and amount are required.");
        }

        double amount;
        try {
            amount = ((Number) amountObj).doubleValue();
        } catch (ClassCastException e) {
            return ResponseEntity.badRequest().body("Invalid amount.");
        }

        Expense expense = new Expense();
        expense.setUser(user);
        expense.setDate(LocalDate.parse(dateStr));
        expense.setCategory(category);
        expense.setAmount(amount);
        expense.setDescription(description != null && !description.isBlank() ? description : null);

        expenseRepository.save(expense);

        return ResponseEntity.ok(Map.of(
                "id", expense.getId(),
                "date", expense.getDate().toString(),
                "category", expense.getCategory(),
                "amount", expense.getAmount(),
                "description", expense.getDescription() != null ? expense.getDescription() : ""
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Expense> expenseOpt = expenseRepository.findByIdAndUser(id, user);
        if (expenseOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        expenseRepository.delete(expenseOpt.get());
        return ResponseEntity.ok().build();
    }
}