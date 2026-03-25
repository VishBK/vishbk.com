# --- Stage 1: Build the Parcel Frontend ---
FROM node:20-alpine AS builder
# Set a descriptive working directory
WORKDIR /vishbk-website

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Final Production Image ---
FROM php:8.2-cli-alpine

# Install CA certificates so curl can verify SSL
RUN apk add --no-cache ca-certificates

WORKDIR /var/www/html

# Copy the Parcel build output from the named stage
COPY --from=builder /vishbk-website/dist /var/www/html

# Copy your PHP proxy file
COPY proxy.php /var/www/html/proxy.php

EXPOSE 8000

# Start PHP server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "/var/www/html"]