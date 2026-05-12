# Notification Service (RabbitMQ + SMTP)

Acest serviciu consumă mesaje din coada RabbitMQ `notifications` și trimite emailuri pentru:

- confirmare înscriere la eveniment (`EVENT_REGISTRATION`)
- reminder cu `N` ore înainte de eveniment (`EVENT_REGISTRATION` + scheduling intern)
- confirmare anulare înscriere (`REGISTRATION_CANCELLED`)
- welcome la creare cont (`USER_REGISTERED`)

## Cum funcționează

1. Backend-ul publică evenimente în RabbitMQ.
2. `EmailNotificationConsumer` consumă mesajele și trimite emailuri via SMTP.
3. Pentru înscrieri, se trimite imediat email de confirmare și se programează reminder-ul.

> Reminder-ul este programat în memorie în procesul `notification-service`. Dacă serviciul se restartează, reminder-ele deja programate trebuie regenerate de noi mesaje.

## Variabile de mediu

### RabbitMQ

- `RABBITMQ_HOST` (implicit `localhost`)
- `RABBITMQ_PORT` (implicit `5672`)
- `RABBITMQ_USER` (implicit `guest`)
- `RABBITMQ_PASS` (implicit `guest`)

### SMTP

- `SMTP_HOST` (implicit `localhost`)
- `SMTP_PORT` (implicit `1025`)
- `SMTP_FROM` (implicit `noreply@utcn-events.local`)
- `SMTP_AUTH` (`true`/`false`, implicit `false`)
- `SMTP_STARTTLS` (`true`/`false`, implicit `false`)
- `SMTP_USER` (opțional)
- `SMTP_PASS` (opțional)

### Reminder

- `REMINDER_HOURS_BEFORE` (implicit `3`)

## Build

Din rădăcina proiectului:

```bash
./gradlew -p notification-service build --no-daemon
```
