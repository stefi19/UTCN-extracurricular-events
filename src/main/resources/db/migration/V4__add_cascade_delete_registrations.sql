-- Drop the existing foreign key and recreate it with ON DELETE CASCADE
-- so deleting an event automatically removes its registrations
ALTER TABLE registrations
    DROP CONSTRAINT IF EXISTS registrations_event_id_fkey;

ALTER TABLE registrations
    ADD CONSTRAINT registrations_event_id_fkey
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
