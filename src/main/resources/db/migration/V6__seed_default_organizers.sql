INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES
('osut@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OSUT', 'Organizer', 'ORGANIZER', true),
('best@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'BEST', 'Organizer', 'ORGANIZER', true),
('gdg@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'GDG', 'Organizer', 'ORGANIZER', true),
('solis@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SOLIS', 'Organizer', 'ORGANIZER', true),
('arttu@utcn.ro', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ARTTU', 'Organizer', 'ORGANIZER', true)
ON CONFLICT (email) DO NOTHING;
