# Notification Service (RabbitMQ + SMTP)

Acest serviciu consumă mesaje din coada RabbitMQ `notifications` și trimite emailuri pentru:

- confirmare înscriere la eveniment (`EVENT_REGISTRATION`)
- reminder cu `N` ore înainte de eveniment (`EVENT_REMINDER_DUE`)
- confirmare anulare înscriere (`REGISTRATION_CANCELLED`)
- welcome la creare cont (`USER_REGISTERED`)

## Cum funcționează

1. Backend-ul publică evenimente în RabbitMQ.
2. `EmailNotificationConsumer` consumă mesajele și trimite emailuri via SMTP.
3. Reminder-ele sunt persistate în DB (`reminder_outbox`) și sunt publicate periodic de backend (`ReminderOutboxDispatcher`) ca `EVENT_REMINDER_DUE`.

✅ Reminder-ele sunt reziliente la restart (nu se pierd la repornirea serviciilor).

## Variabile de mediu

### RabbitMQ

- `RABBITMQ_HOST` (implicit `localhost`)
- `RABBITMQ_PORT` (implicit `5672`)
- `RABBITMQ_USER` (implicit `guest`)
- `RABBITMQ_PASS` (implicit `guest`)

### SMTP

- `SMTP_HOST` (implicit `smtp.office365.com`)
- `SMTP_PORT` (implicit `587`)
- `SMTP_FROM` (implicit `noreply@utcn-events.local`)
- `SMTP_AUTH` (`true`/`false`, implicit `true`)
- `SMTP_STARTTLS` (`true`/`false`, implicit `true`)
- `SMTP_USER` (obligatoriu pentru Outlook)
- `SMTP_PASS` (obligatoriu pentru Outlook)

### Reminder

- `REMINDER_HOURS_BEFORE` (implicit `3`)

## Build

Din rădăcina proiectului:

```bash
./gradlew -p notification-service build --no-daemon
```

## Outlook live setup (local)

1. Copiază template-ul:

```bash
cp .env.example .env
```

2. Completează în `.env`:
	- `SMTP_USER`
	- `SMTP_PASS` (app password / credential)
	- `SMTP_FROM`

3. Repornește serviciile:

```bash
docker compose up -d --build backend notification-service
```
