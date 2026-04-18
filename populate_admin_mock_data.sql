-- Mock Data for My Pet Care+ Admin Dashboard (Final Corrected Schema)
USE mypetcare_db;

-- 1. Create Extra Users (IDs 100-110)
INSERT IGNORE INTO users (user_id, first_name, last_name, email, password_hash, phone, role, is_active, is_verified) VALUES
(100, 'John', 'Smith', 'john.smith@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234560', 'customer', 1, 1),
(101, 'Sarah', 'Jones', 'sarah.jones@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234561', 'customer', 1, 1),
(102, 'Mary', 'Jane', 'mary.jane@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234562', 'customer', 1, 1),
(103, 'David', 'Miller', 'david.miller@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234563', 'customer', 1, 1),
(104, 'Linda', 'Wilson', 'linda.wilson@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234564', 'customer', 1, 1),
(105, 'Dr. Robert', 'Wilson', 'robert.doc@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234565', 'doctor', 1, 1),
(106, 'Dr. Emily', 'Davis', 'emily.doc@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234566', 'doctor', 1, 1),
(107, 'Dr. Michael', 'Brown', 'michael.doc@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234567', 'doctor', 1, 1),
(108, 'Dr. Jessica', 'Taylor', 'jessica.doc@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234568', 'doctor', 1, 1),
(109, 'Dr. Thomas', 'Anderson', 'thomas.doc@example.com', '$2b$10$Xm.7rO.LhH8bA7qO9w6R0O/H6Wd5w/3S8y.yS6L/X5Wz.YF.Z.I6', '0771234569', 'doctor', 1, 1);

-- 2. Create Customers
INSERT IGNORE INTO customers (user_id, loyalty_points, loyalty_tier, total_spent) VALUES
(100, 500, 'silver', 50000.00),
(101, 1200, 'gold', 120000.00),
(102, 50, 'bronze', 5000.00),
(103, 3000, 'platinum', 300000.00),
(104, 150, 'bronze', 15000.00);

-- 3. Create Doctors
INSERT IGNORE INTO doctors (user_id, specialization, experience_years, consultation_fee, rating, total_reviews) VALUES
(105, 'General Surgery', 12, 2500.00, 4.8, 120),
(106, 'Nutrition', 5, 1500.00, 4.5, 45),
(107, 'Cardiology', 15, 3000.00, 4.9, 89),
(108, 'Dermatology', 8, 2000.00, 4.7, 67),
(109, 'Emergency Medicine', 10, 2500.00, 4.6, 54);

-- 4. Create Pets (Inventory)
-- Created by Admin (ID 1)
INSERT IGNORE INTO pets (pet_id, name, species, breed, age, gender, price, is_available, stock_quantity, description, created_by) VALUES
(100, 'Maximus', 'Dog', 'Golden Retriever', 2, 'male', 45000.00, 1, 1, 'Friendly and energetic retriever.', 1),
(101, 'Bella', 'Dog', 'Labrador', 1, 'female', 50000.00, 1, 1, 'Calm and highly trainable.', 1),
(102, 'Charlie', 'Cat', 'Persian', 3, 'male', 35000.00, 1, 1, 'Beautiful long-haired Persian.', 1),
(103, 'Luna', 'Cat', 'Siamese', 1, 'female', 30000.00, 1, 1, 'Active Siamese kitten.', 1),
(104, 'Cooper', 'Dog', 'German Shepherd', 2, 'male', 60000.00, 1, 1, 'Intelligent and protective.', 1),
(105, 'Daisy', 'Dog', 'Beagle', 1, 'female', 35000.00, 1, 1, 'Playful beagle puppy.', 1),
(106, 'Milo', 'Cat', 'Maine Coon', 2, 'male', 45000.00, 1, 1, 'Large and friendly Maine Coon.', 1),
(107, 'Ruby', 'Dog', 'Poodle', 1, 'female', 55000.00, 1, 1, 'Elegant and smart poodle.', 1),
(108, 'Simba', 'Cat', 'Bengal', 2, 'male', 70000.00, 1, 1, 'Exotic looking Bengal cat.', 1),
(109, 'Zoe', 'Dog', 'Husky', 1, 'female', 65000.00, 1, 1, 'Beautiful blue-eyed husky.', 1);

-- 5. Create Orders
INSERT IGNORE INTO orders (order_id, customer_id, order_number, total_amount, discount_amount, final_amount, payment_status, order_status, shipping_address, payment_method, created_at) VALUES
(1000, 1, 'ORD-2026-001', 5000.00, 0.00, 5000.00, 'paid', 'delivered', '123 Main St, Colombo', 'card', '2026-03-20 10:00:00'),
(1001, 1, 'ORD-2026-002', 12000.00, 500.00, 11500.00, 'paid', 'delivered', '123 Main St, Colombo', 'card', '2026-03-25 14:30:00'),
(1002, 2, 'ORD-2026-003', 45000.00, 0.00, 45000.00, 'paid', 'processing', '456 Oak Ave, Kandy', 'card', '2026-04-10 09:15:00'),
(1003, 3, 'ORD-2026-004', 2500.00, 0.00, 2500.00, 'paid', 'delivered', '789 Pine Rd, Galle', 'card', '2026-04-11 11:45:00'),
(1004, 4, 'ORD-2026-005', 15000.00, 1000.00, 14000.00, 'paid', 'shipped', '101 Maple Ln, Negombo', 'card', '2026-04-12 16:20:00'),
(1005, 5, 'ORD-2026-006', 70000.00, 2000.00, 68000.00, 'paid', 'processing', '202 Birch Dr, Jaffna', 'card', '2026-04-14 08:30:00'),
(1006, 1, 'ORD-2026-007', 3500.00, 0.00, 3500.00, 'paid', 'delivered', '123 Main St, Colombo', 'card', '2026-04-15 13:10:00'),
(1007, 2, 'ORD-2026-008', 9000.00, 0.00, 9000.00, 'paid', 'shipped', '456 Oak Ave, Kandy', 'card', '2026-04-16 10:45:00'),
(1008, 3, 'ORD-2026-009', 2000.00, 0.00, 2000.00, 'paid', 'pending', '789 Pine Rd, Galle', 'card', '2026-04-17 15:55:00'),
(1009, 4, 'ORD-2026-010', 45000.00, 5000.00, 40000.00, 'paid', 'processing', '101 Maple Ln, Negombo', 'card', '2026-04-18 09:00:00');

-- 6. Create Order Items
INSERT IGNORE INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal) VALUES
(1000, 'product', 1, 'Royal Canin Puppy Food', 2, 2500.00, 5000.00),
(1001, 'product', 2, 'Dog Grooming Kit', 1, 12000.00, 12000.00),
(1002, 'pet', 100, 'Maximus (Golden Retriever)', 1, 45000.00, 45000.00),
(1003, 'product', 3, 'Cat Litter Tray', 1, 2500.00, 2500.00),
(1004, 'product', 4, 'Premium Bird Cage', 1, 15000.00, 15000.00),
(1005, 'pet', 108, 'Simba (Bengal Cat)', 1, 70000.00, 70000.00),
(1006, 'product', 1, 'Royal Canin Puppy Food', 1, 3500.00, 3500.00),
(1007, 'product', 5, 'Automatic Water Dispenser', 1, 9000.00, 9000.00),
(1008, 'product', 6, 'Cheewy Toys Pack', 2, 1000.00, 2000.00),
(1009, 'pet', 106, 'Milo (Maine Coon)', 1, 45000.00, 45000.00);

-- 7. Create Appointments (Using customer_pet_id=1 for simplicity)
INSERT IGNORE INTO appointments (customer_id, doctor_id, customer_pet_id, appointment_date, appointment_time, status, consultation_fee, created_at) VALUES
(1, 1, 1, '2026-04-05', '10:00:00', 'completed', 1500.00, '2026-04-01'),
(2, 2, 1, '2026-04-06', '11:00:00', 'completed', 2000.00, '2026-04-02'),
(3, 1, 1, '2026-04-07', '09:00:00', 'rejected', 2500.00, '2026-04-03'),
(4, 1, 1, '2026-04-08', '14:00:00', 'completed', 3000.00, '2026-04-04'),
(1, 1, 1, '2026-04-18', '15:00:00', 'pending', 1500.00, '2026-04-15'),
(2, 1, 1, '2026-04-19', '11:00:00', 'pending', 1500.00, '2026-04-16'),
(3, 2, 1, '2026-04-20', '16:00:00', 'pending', 2000.00, '2026-04-17');

-- 8. Create Exchange Requests
INSERT IGNORE INTO exchange_requests (customer_id, order_id, pet_id, reason, status, created_at) VALUES
(1, 1002, 100, 'House space constraints', 'pending', '2026-04-12 10:00:00'),
(2, 1005, 108, 'Allergy developed unexpectedly', 'approved', '2026-04-15 14:00:00'),
(3, 1009, 106, 'Request for a smaller breed', 'rejected', '2026-04-18 09:30:00');
