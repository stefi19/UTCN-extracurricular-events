CREATE TABLE IF NOT EXISTS reminder_outbox (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    recipient_email VARCHAR(255) NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_date VARCHAR(32) NOT NULL,
    event_start_time VARCHAR(64),
    event_location VARCHAR(255),
    event_category VARCHAR(120),
    event_department VARCHAR(120),
    student_first_name VARCHAR(120),
    send_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reminder_status CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_reminder_outbox_status_send_at
    ON reminder_outbox(status, send_at);
CREATE INDEX IF NOT EXISTS idx_reminder_outbox_registration
    ON reminder_outbox(registration_id);
