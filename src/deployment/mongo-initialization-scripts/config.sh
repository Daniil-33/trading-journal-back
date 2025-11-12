#!/bin/bash

# ============================================
# КОНФИГУРАЦИЯ РАЗВЕРТЫВАНИЯ
# ============================================
# Отредактируйте эти переменные под ваши нужды

# === Информация о сервере ===
SERVER_IP="46.62.248.7"                    # IP адрес вашего VPS сервера
SSH_USER="root"                             # Пользователь для SSH подключения

# === Настройки домена ===
DOMAIN="db.wow-shop.xyz"                    # Домен для mongo-express
EMAIL="admin@wow-shop.xyz"                  # Email для SSL сертификата Let's Encrypt

# === Учетные данные MongoDB ===
MONGO_USER="daniildev"                      # Имя пользователя MongoDB
MONGO_PASSWORD="112358"                     # Пароль пользователя MongoDB
MONGO_PORT="27017"                          # Порт MongoDB

# === Учетные данные mongo-express (веб-интерфейс) ===
ADMIN_USER="daniildev"                      # Логин для веб-интерфейса
ADMIN_PASSWORD="112358"                     # Пароль для веб-интерфейса
MONGO_EXPRESS_PORT="8081"                   # Порт mongo-express (внутренний)

# === Настройки Nginx ===
NGINX_HTTP_PORT="80"                        # HTTP порт
NGINX_HTTPS_PORT="443"                      # HTTPS порт

# === Версии ===
MONGODB_VERSION="7.0"                       # Версия MongoDB
MONGO_EXPRESS_VERSION="latest"              # Версия mongo-express

# ============================================
# НЕ ИЗМЕНЯЙТЕ КОД НИЖЕ
# ============================================

export SERVER_IP
export SSH_USER
export DOMAIN
export EMAIL
export MONGO_USER
export MONGO_PASSWORD
export MONGO_PORT
export ADMIN_USER
export ADMIN_PASSWORD
export MONGO_EXPRESS_PORT
export NGINX_HTTP_PORT
export NGINX_HTTPS_PORT
export MONGODB_VERSION
export MONGO_EXPRESS_VERSION
