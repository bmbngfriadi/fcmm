FROM node:20-alpine AS builder

WORKDIR /app

# Install dependensi
COPY package*.json ./
RUN npm install

# Copy seluruh source code
COPY . .

# Generate Prisma Client (Wajib untuk database ORM)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Stage 2: Menjalankan aplikasi
FROM node:20-alpine

WORKDIR /app

# Copy hasil build dari tahap 1
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "start"]
