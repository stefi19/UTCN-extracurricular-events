-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('admin@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 'ADMIN', true),
('john.doe@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Doe', 'STUDENT', true),
('jane.smith@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Smith', 'ORGANIZER', true);
-- Password for all: password123

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Workshop', 'Hands-on technical workshops'),
('Seminar', 'Educational seminars and talks'),
('Conference', 'Academic and technical conferences'),
('Hackathon', 'Programming competitions and hackathons'),
('Social', 'Social and networking events');

-- Insert sample departments  
INSERT INTO departments (name) VALUES
('Computer Science'),
('Automation'),
('Electronics'),
('Communications');

-- Insert sample events (matching simple schema: title, description, date, category, department)
INSERT INTO events (title, description, date, category, department) VALUES
('AI and Machine Learning Workshop', 'Learn the fundamentals of AI and ML with hands-on exercises using Python and TensorFlow.', '2026-05-18 14:00', 'Workshop', 'Computer Science'),
('Web Development Bootcamp', 'Full-stack web development using React, Node.js, and PostgreSQL. Build a complete application from scratch.', '2026-05-25 10:00', 'Workshop', 'Computer Science'),
('Cyber Security Seminar', 'Understanding modern cybersecurity threats and best practices for secure software development.', '2026-05-14 16:00', 'Seminar', 'Computer Science'),
('UTCN Hackathon 2026', '24-hour coding marathon! Build innovative solutions to real-world problems. Prizes for top teams.', '2026-06-01 09:00', 'Hackathon', 'Computer Science'),
('Blockchain Technology Conference', 'Explore the latest developments in blockchain, smart contracts, and decentralized applications.', '2026-06-10 13:00', 'Conference', 'Computer Science'),
('Robotics and IoT Workshop', 'Build and program your own IoT devices. Learn about sensors, microcontrollers, and cloud connectivity.', '2026-05-21 15:00', 'Workshop', 'Automation');
