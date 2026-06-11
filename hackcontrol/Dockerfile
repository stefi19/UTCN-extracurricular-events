# Use the Debian-based 'slim' image
FROM node:18-slim

# --- ADD THIS LINE ---
# Install the OpenSSL CLI tool so Prisma can auto-detect the version
RUN apt-get update && apt-get install -y openssl

# -----------------------

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies. Lockfiles are ignored in this repository.
RUN npm install

# 3. Copy the rest of your app code
COPY . .

# 4. Run prisma generate (will now detect openssl 3.0)
RUN npx prisma generate

# 5. Build your Next.js app. Runtime env is injected by Compose.
RUN SKIP_ENV_VALIDATION=true npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
