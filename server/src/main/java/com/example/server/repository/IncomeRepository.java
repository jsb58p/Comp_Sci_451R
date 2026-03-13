package com.example.server.repository;

import com.example.server.model.Income;
import com.example.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUserOrderByDateDesc(User user);
    Optional<Income> findByIdAndUser(Long id, User user);
}
