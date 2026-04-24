package com.example.server.controller;

import com.example.server.model.Expense;
import com.example.server.model.User;
import com.example.server.repository.ExpenseRepository;
import com.example.server.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = SpendingController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class SpendingControllerTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean ExpenseRepository expenseRepository;
    @MockitoBean UserRepository userRepository;

    private User mockUser;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        mockUser = new User("testuser", "test@example.com", "hashedpassword");
        session = new MockHttpSession();
        session.setAttribute("username", "testuser");
    }

    @Test
    void getExpenses_noSession_returns401() throws Exception {
        mockMvc.perform(get("/api/spending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getExpenses_authenticated_returnsList() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));

        Expense e = new Expense();
        e.setId(1L);
        e.setUser(mockUser);
        e.setDate(LocalDate.of(2024, 1, 15));
        e.setCategory("Food");
        e.setAmount(50.0);

        when(expenseRepository.findByUserOrderByDateDesc(mockUser)).thenReturn(List.of(e));

        mockMvc.perform(get("/api/spending").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].category").value("Food"))
                .andExpect(jsonPath("$[0].amount").value(50.0))
                .andExpect(jsonPath("$[0].date").value("2024-01-15"));
    }

    @Test
    void getExpenses_emptyList_returnsEmptyArray() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(expenseRepository.findByUserOrderByDateDesc(mockUser)).thenReturn(List.of());

        mockMvc.perform(get("/api/spending").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void addExpense_noSession_returns401() throws Exception {
        mockMvc.perform(post("/api/spending")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2024-01-01\",\"category\":\"Food\",\"amount\":25.0}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void addExpense_missingFields_returns400() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(post("/api/spending")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"Food\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void addExpense_valid_returnsCreatedExpense() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(42L);
            return e;
        });

        mockMvc.perform(post("/api/spending")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2024-01-01\",\"category\":\"Food\",\"amount\":25.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.category").value("Food"))
                .andExpect(jsonPath("$.amount").value(25.0));
    }

    @Test
    void addExpense_withDescription_persistsDescription() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        mockMvc.perform(post("/api/spending")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2024-03-10\",\"category\":\"Transport\",\"amount\":15.5,\"description\":\"Bus fare\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Bus fare"));
    }

    @Test
    void deleteExpense_noSession_returns401() throws Exception {
        mockMvc.perform(delete("/api/spending/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteExpense_notFound_returns404() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(expenseRepository.findByIdAndUser(1L, mockUser)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/spending/1").session(session))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteExpense_valid_returns200AndDeletes() throws Exception {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));

        Expense e = new Expense();
        e.setId(1L);
        e.setUser(mockUser);
        e.setDate(LocalDate.of(2024, 1, 1));
        e.setCategory("Food");
        e.setAmount(50.0);

        when(expenseRepository.findByIdAndUser(1L, mockUser)).thenReturn(Optional.of(e));

        mockMvc.perform(delete("/api/spending/1").session(session))
                .andExpect(status().isOk());

        verify(expenseRepository).delete(e);
    }
}