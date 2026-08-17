CREATE DATABASE IF NOT EXISTS flexpath_final;
USE flexpath_final;

DROP TABLE IF EXISTS build_parts;
DROP TABLE IF EXISTS builds;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

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

CREATE TABLE builds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE TABLE build_parts (
    build_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (build_id, part_id),
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- SEED DATA
-- --------------------------------------------------------

-- All passwords are 'password' (using provided bcrypt hash)
INSERT INTO users (username, password) VALUES 
('admin', '$2a$10$tBTfzHzjmQVKza3VSa5lsOX6/iL93xPVLlLXYg2FhT6a.jb1o6VDq'),
('user',  '$2a$10$tBTfzHzjmQVKza3VSa5lsOX6/iL93xPVLlLXYg2FhT6a.jb1o6VDq'),
('guest_builder', '$2a$10$tBTfzHzjmQVKza3VSa5lsOX6/iL93xPVLlLXYg2FhT6a.jb1o6VDq');

INSERT INTO roles (username, role) VALUES 
('admin', 'ADMIN'),
('admin', 'USER'),
('user', 'USER'),
('guest_builder', 'USER');

-- Adding a comprehensive list of parts across all major categories
INSERT INTO parts (name, category, brand, model, price, description, is_public, username) VALUES
-- CPUs
('AMD Ryzen 7 7800X3D', 'CPU', 'AMD', '100-100000910WOF', 449.00, '8-core gaming CPU with 3D V-Cache', TRUE, 'admin'),
('Intel Core i9-14900K', 'CPU', 'Intel', 'BX8071514900K', 589.99, '24-Core, 32-Thread Desktop Processor', TRUE, 'admin'),
('AMD Ryzen 5 7600X', 'CPU', 'AMD', '100-100000593WOF', 229.00, '6-core, 12-thread unlocked desktop processor', TRUE, 'user'),

-- GPUs
('NVIDIA RTX 4090 24GB', 'GPU', 'NVIDIA', 'Founders Edition', 1599.00, 'Flagship GPU, massive VRAM perfect for local LLM inference and 4K gaming', TRUE, 'admin'),
('NVIDIA RTX 4070 Super', 'GPU', 'NVIDIA', 'RTX 4070S', 599.00, 'Excellent 1440p performance and efficiency', TRUE, 'user'),
('AMD Radeon RX 7800 XT', 'GPU', 'XFX', 'RX-78Tair', 499.99, '16GB VRAM, great value for rasterization', TRUE, 'guest_builder'),

-- Motherboards
('MSI MAG B650 TOMAHAWK WIFI', 'Motherboard', 'MSI', 'MAG B650', 199.99, 'Solid AM5 ATX motherboard with Wi-Fi 6E', TRUE, 'admin'),
('ASUS ROG MAXIMUS Z790 HERO', 'Motherboard', 'ASUS', 'Z790 HERO', 629.99, 'Premium Intel LGA 1700 ATX motherboard', TRUE, 'admin'),

-- RAM
('Corsair Vengeance 32GB DDR5', 'RAM', 'Corsair', 'CMK32GX5M2B6000C30', 114.99, '32GB (2x16GB) 6000MHz CL30', TRUE, 'admin'),
('G.Skill Trident Z5 64GB DDR5', 'RAM', 'G.Skill', 'F5-6400J3239G32GX2-TZ5RK', 215.99, '64GB (2x32GB) 6400MHz, ideal for heavy workloads', TRUE, 'user'),

-- Storage
('Samsung 990 PRO 2TB NVMe', 'Storage', 'Samsung', 'MZ-V9P2T0B/AM', 169.99, 'PCIe Gen4 NVMe M.2 SSD, up to 7450 MB/s', TRUE, 'admin'),
('Crucial P3 Plus 1TB NVMe', 'Storage', 'Crucial', 'CT1000P3PSSD8', 69.99, 'Budget friendly Gen4 storage', TRUE, 'guest_builder'),

-- Power Supplies
('Corsair RM850x', 'PSU', 'Corsair', 'CP-9020200-NA', 149.99, '850 Watt, 80+ Gold Certified, Fully Modular', TRUE, 'admin'),
('Seasonic Vertex GX-1200', 'PSU', 'Seasonic', 'Vertex GX-1200', 249.99, '1200W ATX 3.0 / PCIe 5.0 compliant', TRUE, 'admin'),

-- Cases
('Fractal Design North', 'Case', 'Fractal Design', 'FD-C-NOR1C-01', 139.99, 'Mid-tower case with real walnut wood front', TRUE, 'user'),
('Lian Li PC-O11 Dynamic', 'Case', 'Lian Li', 'O11DX', 149.99, 'Dual chamber ATX mid-tower, tempered glass', TRUE, 'admin'),

-- Coolers
('Noctua NH-D15', 'Cooler', 'Noctua', 'NH-D15', 119.95, 'Premium dual-tower CPU cooler', TRUE, 'admin'),
('Secret Sauce Custom Loop Kit', 'Cooler', 'Custom', 'Proto-1', 350.00, 'Experimental private cooling setup with custom distro plate', FALSE, 'user');

-- Adding complete, realistic builds
INSERT INTO builds (name, description, is_public, username) VALUES
('Local AI & Dev Workstation', 'High-end machine with 64GB of RAM and 24GB of VRAM. Designed specifically for running agentic AI loops and compiling massive codebases locally.', TRUE, 'admin'),
('Budget 1440p Gaming Rig', 'A solid price-to-performance machine balancing a Ryzen 5 and a 7800 XT inside a beautiful wood-accented case.', TRUE, 'guest_builder'),
('My Experimental Silent Build', 'Work in progress. Testing custom loops to see if I can get temps down without fan noise.', FALSE, 'user');

-- Linking parts to builds (creating complete PCs)
INSERT INTO build_parts (build_id, part_id, quantity) VALUES
-- Build 1: Local AI & Dev Workstation (Needs the 14900K, 4090, 64GB RAM, etc.)
(1, 2, 1),  -- i9-14900K
(1, 4, 1),  -- RTX 4090
(1, 8, 1),  -- ASUS Z790 Mobo
(1, 10, 1), -- 64GB RAM
(1, 11, 2), -- 2x 2TB Samsung SSDs (qty: 2)
(1, 14, 1), -- 1200W PSU
(1, 16, 1), -- Lian Li Case
(1, 17, 1), -- Noctua Cooler

-- Build 2: Budget 1440p Gaming Rig
(2, 3, 1),  -- Ryzen 5 7600X
(2, 6, 1),  -- RX 7800 XT
(2, 7, 1),  -- MSI B650 Mobo
(2, 9, 1),  -- 32GB RAM
(2, 12, 1), -- 1TB Crucial SSD
(2, 13, 1), -- 850W PSU
(2, 15, 1), -- Fractal North Case
(2, 17, 1), -- Noctua Cooler

-- Build 3: Private Silent Build
(3, 1, 1),  -- Ryzen 7 7800X3D
(3, 5, 1),  -- RTX 4070 Super
(3, 7, 1),  -- MSI B650 Mobo
(3, 9, 1),  -- 32GB RAM
(3, 18, 1); -- Secret Sauce Cooler