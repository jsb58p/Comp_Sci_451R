package com.example.server.service;

import com.example.server.model.Expense;
import com.example.server.model.Income;
import com.example.server.model.User;
import com.example.server.repository.ExpenseRepository;
import com.example.server.repository.IncomeRepository;
import com.example.server.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardDataService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public DashboardDataService(IncomeRepository incomeRepository,
                                ExpenseRepository expenseRepository,
                                UserRepository userRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    public User getSessionUser(HttpSession session) {
        String username = (String) session.getAttribute("username");
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
    }

    public Map<String, Object> buildDashboardData(User user) {
        List<Income> allIncomes = incomeRepository.findByUserOrderByDateDesc(user);
        List<Expense> allExpenses = expenseRepository.findByUserOrderByDateDesc(user);
        YearMonth currentMonth = YearMonth.now();

        double monthlyIncome = allIncomes.stream()
                .filter(i -> YearMonth.from(i.getDate()).equals(currentMonth))
                .mapToDouble(Income::getAmount)
                .sum();

        double monthlyExpenses = allExpenses.stream()
                .filter(e -> YearMonth.from(e.getDate()).equals(currentMonth))
                .mapToDouble(Expense::getAmount)
                .sum();

        double totalIncome = allIncomes.stream().mapToDouble(Income::getAmount).sum();
        double totalExpenses = allExpenses.stream().mapToDouble(Expense::getAmount).sum();
        double totalBalance = totalIncome - totalExpenses;

        List<Map<String, Object>> recentTransactions = new ArrayList<>();
        for (Income income : allIncomes) {
            Map<String, Object> transaction = new LinkedHashMap<>();
            transaction.put("id", "i-" + income.getId());
            transaction.put("date", income.getDate().toString());
            transaction.put("description", income.getDescription() != null ? income.getDescription() : "");
            transaction.put("category", income.getCategory());
            transaction.put("amount", income.getAmount());
            transaction.put("type", "income");
            recentTransactions.add(transaction);
        }
        for (Expense expense : allExpenses) {
            Map<String, Object> transaction = new LinkedHashMap<>();
            transaction.put("id", "e-" + expense.getId());
            transaction.put("date", expense.getDate().toString());
            transaction.put("description", expense.getDescription() != null ? expense.getDescription() : "");
            transaction.put("category", expense.getCategory());
            transaction.put("amount", expense.getAmount());
            transaction.put("type", "expense");
            recentTransactions.add(transaction);
        }
        recentTransactions.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));
        List<Map<String, Object>> topTen = recentTransactions.stream().limit(10).toList();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth yearMonth = currentMonth.minusMonths(i);
            double income = allIncomes.stream()
                    .filter(entry -> YearMonth.from(entry.getDate()).equals(yearMonth))
                    .mapToDouble(Income::getAmount)
                    .sum();
            double expenses = allExpenses.stream()
                    .filter(entry -> YearMonth.from(entry.getDate()).equals(yearMonth))
                    .mapToDouble(Expense::getAmount)
                    .sum();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", yearMonth.format(formatter));
            item.put("income", income);
            item.put("expenses", expenses);
            monthlyTrend.add(item);
        }

        Map<String, Double> byCategory = allExpenses.stream()
                .collect(Collectors.groupingBy(Expense::getCategory, Collectors.summingDouble(Expense::getAmount)));
        List<Map<String, Object>> spendingByCategory = byCategory.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .sorted((a, b) -> Double.compare((double) b.get("value"), (double) a.get("value")))
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("monthlyIncome", monthlyIncome);
        response.put("monthlyExpenses", monthlyExpenses);
        response.put("recentTransactions", topTen);
        response.put("monthlyTrend", monthlyTrend);
        response.put("spendingByCategory", spendingByCategory);
        return response;
    }
}
