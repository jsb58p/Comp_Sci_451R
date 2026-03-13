package com.example.server.repository;

import com.example.server.model.Expense;
import com.example.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserOrderByDateDesc(User user);
    Optional<Expense> findByIdAndUser(Long id, User user);
}