-- SocietyEase MySQL Database Schema

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'resident') DEFAULT 'resident',
    flat_no VARCHAR(50) DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL
);

-- Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Verified') DEFAULT 'Pending',
    method VARCHAR(50) DEFAULT 'System Gen',
    month_name VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    payment_date DATETIME DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('Pending', 'Resolved') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT DEFAULT NULL,
    spent_date DATE NOT NULL
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Society Settings Table
CREATE TABLE IF NOT EXISTS society_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    society_name VARCHAR(255) NOT NULL DEFAULT 'My Residential Society',
    maintenance_amount DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
    qr_image VARCHAR(255) DEFAULT NULL
);

-- Seed Initial Society Settings Row (Required for /api/society/settings route to function)
INSERT INTO society_settings (id, society_name, maintenance_amount) 
VALUES (1, 'My Residential Society', 1500.00)
ON DUPLICATE KEY UPDATE id=id;
