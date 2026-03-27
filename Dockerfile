# --- Stage 1: Build the Parcel Frontend ---
FROM node:lts-alpine AS builder
# Set a descriptive working directory
WORKDIR /vishbk-website

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Final Production Image ---
FROM php:8.4-apache

# Enable Apache mod_rewrite for .htaccess support
RUN a2enmod rewrite

# Allow .htaccess to override configurations
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Install CA certificates so curl can verify SSL
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Copy the Parcel build output from the named stage
COPY --from=builder /vishbk-website/dist /var/www/html

# Explicitly copy the icons directory so all absolute /icons/... references work
COPY icons /var/www/html/icons

# Copy your PHP proxy file
COPY proxy.php /var/www/html/proxy.php

# Copy the .htaccess file to enable URL rewriting
COPY .htaccess /var/www/html/.htaccess

# Update Apache to listen on port 8000 so we don't break existing docker run configs
RUN sed -i 's/80/8000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

EXPOSE 8000