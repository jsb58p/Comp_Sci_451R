package com.example.server.controller;

import com.example.server.model.Expense;
import com.example.server.model.Income;
import com.example.server.model.User;
import com.example.server.repository.ExpenseRepository;
import com.example.server.repository.IncomeRepository;
import com.example.server.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public DashboardController(IncomeRepository incomeRepository,
                               ExpenseRepository expenseRepository,
                               UserRepository userRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    private User getSessionUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) return null;
        return userRepository.findByUsername(username).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getDashboard(HttpSession session) {
        User user = getSessionUser(session);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        List<Income> allIncomes = incomeRepository.findByUserOrderByDateDesc(user);
        List<Expense> allExpenses = expenseRepository.findByUserOrderByDateDesc(user);

        YearMonth currentMonth = YearMonth.now();

        // Monthly income and expenses
        double monthlyIncome = allIncomes.stream()
                .filter(i -> YearMonth.from(i.getDate()).equals(currentMonth))
                .mapToDouble(Income::getAmount)
                .sum();

        double monthlyExpenses = allExpenses.stream()
                .filter(e -> YearMonth.from(e.getDate()).equals(currentMonth))
                .mapToDouble(Expense::getAmount)
                .sum();

        // Total balance
        double totalIncome = allIncomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExpenses = allExpenses.stream().mapToDouble(Expense::getAmount).sum();
        double totalBalance = totalIncome - totalExpenses;

        // Recent transactions (last 10, combined, sorted by date desc)
        List<Map<String, Object>> recentTransactions = new ArrayList<>();
        for (Income i : allIncomes) {
            Map<String, Object> t = new HashMap<>();
            t.put("id", "i-" + i.getId());
            t.put("date", i.getDate().toString());
            t.put("description", i.getDescription() != null ? i.getDescription() : "");
            t.put("category", i.getCategory());
            t.put("amount", i.getAmount());
            t.put("type", "income");
            recentTransactions.add(t);
        }
        for (Expense e : allExpenses) {
            Map<String, Object> t = new HashMap<>();
            t.put("id", "e-" + e.getId());
            t.put("date", e.getDate().toString());
            t.put("description", e.getDescription() != null ? e.getDescription() : "");
            t.put("category", e.getCategory());
            t.put("amount", e.getAmount());
            t.put("type", "expense");
            recentTransactions.add(t);
        }
        recentTransactions.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));
        List<Map<String, Object>> top10 = recentTransactions.stream().limit(10).toList();

        // Monthly trend — last 6 months
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentMonth.minusMonths(i);
            double inc = allIncomes.stream()
                    .filter(x -> YearMonth.from(x.getDate()).equals(ym))
                    .mapToDouble(Income::getAmount).sum();
            double exp = allExpenses.stream()
                    .filter(x -> YearMonth.from(x.getDate()).equals(ym))
                    .mapToDouble(Expense::getAmount).sum();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", ym.format(fmt));
            entry.put("income", inc);
            entry.put("expenses", exp);
            monthlyTrend.add(entry);
        }

        // Spending by category
        Map<String, Double> byCat = allExpenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory,
                        Collectors.summingDouble(Expense::getAmount)));
        List<Map<String, Object>> spendingByCategory = byCat.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", e.getKey());
                    m.put("value", e.getValue());
                    return m;
                })
                .sorted((a, b) -> Double.compare((double) b.get("value"), (double) a.get("value")))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("monthlyIncome", monthlyIncome);
        response.put("monthlyExpenses", monthlyExpenses);
        response.put("recentTransactions", top10);
        response.put("monthlyTrend", monthlyTrend);
        response.put("spendingByCategory", spendingByCategory);

        return ResponseEntity.ok(response);
    }
}
