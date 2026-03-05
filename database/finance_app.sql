CREATE DATABASE IF NOT EXISTS finance_app;
USE finance_app;
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('USER','ADMIN') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    type ENUM('INCOME','EXPENSE')
);
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    category_id BIGINT,
    amount DECIMAL(10,2),
    type ENUM('INCOME','EXPENSE'),
    description VARCHAR(255),
    transaction_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE TABLE api_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    endpoint VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO categories (name, type) VALUES
('Salary','INCOME'),
('Investment','INCOME'),
('Groceries','EXPENSE'),
('Utilities','EXPENSE'),
('Entertainment','EXPENSE');
INSERT INTO users (username, email, password, role) VALUES
('testuser','test@example.com','hashed_password','USER');
INSERT INTO users (username, email, password, role) VALUES
('newuser','new@example.com','hashed_password','USER');
INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date) VALUES
(1,1,5000.00,'INCOME','Salary for March','2026-03-01');
INSERT INTO api_logs (endpoint, error_message) VALUES
('/login','Invalid password');
