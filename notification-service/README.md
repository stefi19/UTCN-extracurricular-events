# Notification Service (RabbitMQ + SMTP)

This service consumes messages from the RabbitMQ `notifications` queue and sends emails for:

- event registration confirmation (`EVENT_REGISTRATION`)
- reminder N hours before an event (`EVENT_REMINDER_DUE`)
- registration cancellation confirmation (`REGISTRATION_CANCELLED`)
- welcome email on account creation (`USER_REGISTERED`)

## How it works

1. The backend publishes events to RabbitMQ.
2. `EmailNotificationConsumer` consumes the messages and sends emails via SMTP.
3. Reminders are persisted in the DB (`reminder_outbox`) and are periodically published by the backend (`ReminderOutboxDispatcher`) as `EVENT_REMINDER_DUE`.

✅ Reminders are resilient to restarts — they are not lost if services are restarted.

## Environment variables

### RabbitMQ

- `RABBITMQ_HOST` (default: `localhost`)
- `RABBITMQ_PORT` (default: `5672`)
- `RABBITMQ_USER` (default: `guest`)
- `RABBITMQ_PASS` (default: `guest`)

### SMTP

- `SMTP_HOST` (default: `smtp.office365.com`)
- `SMTP_PORT` (default: `587`)
- `SMTP_FROM` (default: `noreply@utcn-events.local`)
- `SMTP_AUTH` (`true`/`false`, default: `true`)
- `SMTP_STARTTLS` (`true`/`false`, default: `true`)
- `SMTP_USER` (required for Outlook)
- `SMTP_PASS` (required for Outlook)

### Reminder

- `REMINDER_HOURS_BEFORE` (default: `3`)

## Build

From the project root:

```bash
./gradlew -p notification-service build --no-daemon
```

## Outlook live setup (local)

1. Copy the template:

```bash
cp .env.example .env
```

2. Fill in `.env`:
   - `SMTP_USER`
   - `SMTP_PASS` (app password / credential)
   - `SMTP_FROM`

3. Restart the services:

```bash
docker compose up -d --build backend notification-service
```
