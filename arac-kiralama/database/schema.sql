CREATE DATABASE IF NOT EXISTS rentacar_premtimi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rentacar_premtimi;

DROP TABLE IF EXISTS mileage_logs, damage_reports, expenses, maintenance_records, invoices, contracts, additional_drivers, reservations, customers, vehicle_images, vehicles, admins, settings;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  plate_number VARCHAR(40) NOT NULL UNIQUE,
  fuel_type VARCHAR(40) NOT NULL,
  transmission VARCHAR(40) NOT NULL,
  daily_price DECIMAL(10,2) NOT NULL,
  mileage INT NOT NULL DEFAULT 0,
  insurance_expiry DATE NULL,
  registration_expiry DATE NULL,
  status ENUM('available','rented','maintenance','inactive') NOT NULL DEFAULT 'available',
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE vehicle_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  passport_no VARCHAR(100) NULL,
  license_no VARCHAR(100) NULL,
  license_expiry DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  pickup_location VARCHAR(190) NOT NULL,
  return_location VARCHAR(190) NOT NULL,
  pickup_at DATETIME NOT NULL,
  return_at DATETIME NOT NULL,
  days INT NOT NULL,
  daily_price DECIMAL(10,2) NOT NULL,
  outside_kosovo_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  additional_driver_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending','approved','rejected','active','completed','cancelled') NOT NULL DEFAULT 'pending',
  start_mileage INT NULL,
  end_mileage INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB;

CREATE TABLE additional_drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(60) NULL,
  passport_no VARCHAR(100) NULL,
  license_no VARCHAR(100) NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  contract_number VARCHAR(80) NOT NULL UNIQUE,
  terms TEXT NOT NULL,
  insurance_terms TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  invoice_number VARCHAR(80) NOT NULL UNIQUE,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status ENUM('unpaid','paid','cancelled') NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  next_service_mileage INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NULL,
  category ENUM('fuel','service','insurance','tax','fine','other') NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE damage_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  report_date DATE NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  file_path VARCHAR(255) NULL,
  status_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE mileage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  reservation_id INT NULL,
  log_date DATE NOT NULL,
  start_mileage INT NOT NULL DEFAULT 0,
  end_mileage INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL
) ENGINE=InnoDB;

INSERT INTO admins (name, email, password_hash, role, is_active) VALUES
('Premtimi Admin', 'admin@premtimi.local', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 1);

INSERT INTO vehicles (name, brand, model, year, plate_number, fuel_type, transmission, daily_price, mileage, insurance_expiry, registration_expiry, status, description) VALUES
('Volkswagen Golf 7', 'Volkswagen', 'Golf 7', 2018, '01-123-AB', 'Dizel', 'Manual', 35.00, 142000, DATE_ADD(CURDATE(), INTERVAL 25 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'available', 'Ekonomik, şehir içi ve uzun yol için ideal.'),
('Mercedes-Benz C Class', 'Mercedes-Benz', 'C220', 2020, '01-777-CD', 'Dizel', 'Automatic', 75.00, 88000, DATE_ADD(CURDATE(), INTERVAL 90 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'available', 'Konforlu premium sedan.'),
('Toyota Corolla Hybrid', 'Toyota', 'Corolla', 2021, '01-555-EF', 'Hibrit', 'Automatic', 55.00, 64000, DATE_ADD(CURDATE(), INTERVAL 120 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), 'available', 'Düşük tüketimli otomatik hibrit araç.');

INSERT INTO vehicle_images (vehicle_id, image_path, is_primary) VALUES
(1, 'assets/css/car-placeholder.svg', 1),
(2, 'assets/css/car-placeholder.svg', 1),
(3, 'assets/css/car-placeholder.svg', 1);

INSERT INTO customers (full_name, phone, email, address, passport_no, license_no) VALUES
('Arben Krasniqi', '+38344111222', 'arben@example.com', 'Prishtina, Kosova', 'P1234567', 'L7654321');

INSERT INTO reservations (customer_id, vehicle_id, pickup_location, return_location, pickup_at, return_at, days, daily_price, outside_kosovo_fee, additional_driver_fee, total_price, status, start_mileage, notes) VALUES
(1, 1, 'Prishtina Airport', 'Prishtina Center', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 3, 35.00, 0, 0, 105.00, 'pending', 142000, 'Demo pending reservation');

INSERT INTO settings (setting_key, setting_value) VALUES
('currency', 'EUR'),
('outside_kosovo_default_fee', '50'),
('additional_driver_daily_fee', '15');
