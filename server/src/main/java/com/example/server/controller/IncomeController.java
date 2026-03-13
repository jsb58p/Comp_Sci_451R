package com.example.server.controller;

import com.example.server.model.Income;
import com.example.server.model.User;
import com.example.server.repository.IncomeRepository;
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
@RequestMapping("/api/income")
public class IncomeController {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public IncomeController(IncomeRepository incomeRepository, UserRepository userRepository) {
        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
    }

    private User getSessionUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return null;
        return userRepository.findByUsername(username).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getIncomes(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<Income> incomes = incomeRepository.findByUserOrderByDateDesc(user);
        List<Map<String, Object>> result = incomes.stream().map(i -> Map.<String, Object>of(
                "id", i.getId(),
                "date", i.getDate().toString(),
                "category", i.getCategory(),
                "amount", i.getAmount(),
                "description", i.getDescription() != null ? i.getDescription() : ""
        )).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> addIncome(@RequestBody Map<String, Object> body, HttpSession session) {
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

        Income income = new Income();
        income.setUser(user);
        income.setDate(LocalDate.parse(dateStr));
        income.setCategory(category);
        income.setAmount(amount);
        income.setDescription(description != null && !description.isBlank() ? description : null);

        incomeRepository.save(income);

        return ResponseEntity.ok(Map.of(
                "id", income.getId(),
                "date", income.getDate().toString(),
                "category", income.getCategory(),
                "amount", income.getAmount(),
                "description", income.getDescription() != null ? income.getDescription() : ""
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIncome(@PathVariable Long id, HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Income> incomeOpt = incomeRepository.findByIdAndUser(id, user);
        if (incomeOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        incomeRepository.delete(incomeOpt.get());
        return ResponseEntity.ok().build();
    }
}
