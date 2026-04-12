# Kotlin MVC backend sample (Ktor)

This module is a minimal Kotlin backend for UTCN extracurricular events.

Architecture used
- `model`: domain/request models (`Event`, `EventRequest`)
- `view`: API response DTO (`EventView`)
- `controller`: HTTP routes (`EventController`)
- `service`: business logic/validation (`EventService`)
- `repository`: storage abstraction (`EventRepository`, `PostgresEventRepository`)
- `dao`: JDBC data access objects (`EventDao`, `JdbcEventDao`)
- `db/migration`: Flyway SQL migrations

## 1) Local environment setup (macOS)

```zsh
brew install openjdk@17
```

If needed, set Java 17 for your shell session:

```zsh
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
java -version
```

> This project includes Gradle Wrapper, so you can use `./gradlew` without installing Gradle globally.

## 2) Start PostgreSQL with one command

From `kotlin-sample`:

```zsh
docker compose up -d
```

Stop DB when needed:

```zsh
docker compose down
```

## 3) Build and run with PostgreSQL + Flyway

From `kotlin-sample`:

```zsh
export EVENTS_STORAGE=postgres
export DATABASE_URL="jdbc:postgresql://localhost:5432/utcnevents"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD="postgres"
./gradlew build
./gradlew run
```

On startup, Flyway runs migrations from `src/main/resources/db/migration`.

If you want to run without PostgreSQL, skip env vars and run normally:

```zsh
./gradlew run
```

## 4) Quick API checks

```zsh
curl http://localhost:8080/health
```

Create an event:

```zsh
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Workshop",
    "description": "Intro to AI for students",
    "date": "2026-05-10",
    "category": "Workshop",
    "department": "CS"
  }'
```

List events:

```zsh
curl http://localhost:8080/api/events
```

Update event `1`:

```zsh
curl -X PUT http://localhost:8080/api/events/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Workshop Updated",
    "description": "Hands-on intro to AI",
    "date": "2026-05-11",
    "category": "Workshop",
    "department": "CS"
  }'
```

Delete event `1`:

```zsh
curl -X DELETE http://localhost:8080/api/events/1 -i
```
