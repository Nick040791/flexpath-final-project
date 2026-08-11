CREATE DATABASE IF NOT EXISTS flexpath_final;
USE flexpath_final;

-- Clean up in REVERSE dependency order
DROP TABLE IF EXISTS build_parts;
DROP TABLE IF EXISTS builds;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- ========== USERS / ROLES  ===========
CREATE TABLE users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255)
);

CREATE TABLE roles (
    username VARCHAR(255) NOT NULL,
    role VARCHAR(250) NOT NULL,
    PRIMARY KEY (username, role),
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- =========== PARTS ==========
CREATE TABLE parts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(150),
    price DECIMAL(10,2),
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- ========== BUILDS ==========
CREATE TABLE builds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- ========== BUILD_PARTS (join table) ==========
CREATE TABLE build_parts (
    build_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (build_id, part_id),
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
);

-- ========== SEED USERS ==========
INSERT INTO users (username, password) VALUES 
('admin', '$2a$10$tBTfzHzjmQVKza3VSa5lsOX6/iL93xPVLlLXYg2FhT6a.jb1o6VDq'),
('user',  '$2a$10$tBTfzHzjmQVKza3VSa5lsOX6/iL93xPVLlLXYg2FhT6a.jb1o6VDq');

INSERT INTO roles (username, role) VALUES 
('admin', 'ADMIN'),
('user', 'USER');

-- ========== SEED PARTS (use the usernames that actually exist) ==========
INSERT INTO parts (name, category, brand, model, price, description, is_public, username) VALUES
('AMD Ryzen 7 7800X3D', 'CPU', 'AMD', '7800X3D', 449.00, '8-core gaming CPU with 3D V-Cache', TRUE, 'user'),
('NVIDIA RTX 4070 Super', 'GPU', 'NVIDIA', '4070 Super', 599.00, 'Great 1440p performance', TRUE, 'user'),
('Corsair Vengeance 32GB DDR5', 'RAM', 'Corsair', 'CMK32GX5M2B5600C36', 109.00, '32GB (2x16) 5600MHz', TRUE, 'admin'),
('Secret Sauce Custom Loop Kit', 'Cooler', 'Custom', 'Proto-1', 350.00, 'Experimental private cooling setup', FALSE, 'user');

-- ========== SEED BUILDS ==========
INSERT INTO builds (name, description, is_public, username) VALUES
('Budget 1440p Gaming Build', 'Solid 1440p performance under $1200', TRUE, 'user'),
('Admin Showcase Rig', 'High-end demo build', TRUE, 'admin'),
('My Experimental Silent Build', 'Work in progress - private', FALSE, 'user');

-- ========== SEED BUILD_PARTS ==========
-- auto-increment should start at 1 and the inserts above should be in order:
INSERT INTO build_parts (build_id, part_id, quantity) VALUES
(1, 1, 1),  -- Budget build + Ryzen
(1, 2, 1),  -- Budget build + 4070 Super
(1, 3, 1),  -- Budget build + RAM
(2, 1, 1),  -- Admin rig + Ryzen
(2, 2, 1);  -- Admin rig + 4070 Super