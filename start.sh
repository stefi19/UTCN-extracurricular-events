#!/bin/bash

echo "Starting database..."
docker-compose up -d

echo "Waiting for database to be ready..."
until docker exec utcn-events-db pg_isready -U postgres -d utcnevents > /dev/null 2>&1; do
    sleep 1
done
echo "Database is ready."

echo "Starting backend..."
./gradlew run
