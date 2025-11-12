#!/bin/bash

# ============================================
# СКРИПТ УСТАНОВКИ ЗАВИСИМОСТЕЙ
# ============================================
# Устанавливает все необходимые зависимости для работы системы

set -e  # Остановка при ошибке

echo "=========================================="
echo "  УСТАНОВКА ЗАВИСИМОСТЕЙ"
echo "=========================================="
echo ""

# Обновление системы
echo "📦 Обновление списка пакетов..."
sudo apt-get update -qq

# Установка базовых утилит
echo "🔧 Установка базовых утилит..."
sudo apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

# Установка MongoDB
echo ""
echo "📊 Установка MongoDB ${MONGODB_VERSION}..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB уже установлен"
    mongod --version | head -1
else
    echo "   Добавление GPG ключа MongoDB..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | \
        sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg
    
    echo "   Добавление репозитория MongoDB..."
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/${MONGODB_VERSION} multiverse" | \
        sudo tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list
    
    echo "   Обновление списка пакетов..."
    sudo apt-get update -qq
    
    echo "   Установка MongoDB..."
    sudo apt-get install -y mongodb-org
    
    echo "✅ MongoDB установлен"
fi

# Запуск и автозапуск MongoDB
echo "   Настройка автозапуска MongoDB..."
sudo systemctl daemon-reload
sudo systemctl enable mongod
sudo systemctl start mongod

# Проверка статуса MongoDB
if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB запущен и работает"
else
    echo "❌ Ошибка: MongoDB не запущен"
    exit 1
fi

# Установка Docker
echo ""
echo "🐳 Установка Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker уже установлен"
    docker --version
else
    echo "   Загрузка и установка Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
    
    echo "   Добавление пользователя в группу docker..."
    sudo usermod -aG docker $USER
    
    echo "✅ Docker установлен"
fi

# Установка Docker Compose
echo ""
echo "🐳 Установка Docker Compose..."
if command -v docker compose version &> /dev/null; then
    echo "✅ Docker Compose уже установлен"
    docker compose version
else
    echo "   Установка плагина Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose установлен"
fi

# Установка Nginx
echo ""
echo "🌐 Установка Nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx уже установлен"
    nginx -v 2>&1 | head -1
else
    echo "   Установка Nginx..."
    sudo apt-get install -y nginx
    echo "✅ Nginx установлен"
fi

# Запуск и автозапуск Nginx
echo "   Настройка автозапуска Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx запущен и работает"
else
    echo "❌ Ошибка: Nginx не запущен"
    exit 1
fi

# Установка Certbot для SSL
echo ""
echo "🔒 Установка Certbot (Let's Encrypt)..."
if command -v certbot &> /dev/null; then
    echo "✅ Certbot уже установлен"
    certbot --version
else
    echo "   Установка Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot установлен"
fi

# Настройка файрвола
echo ""
echo "🔥 Настройка файрвола (UFW)..."
if command -v ufw &> /dev/null; then
    echo "   Открытие необходимых портов..."
    sudo ufw allow 22/tcp comment 'SSH' 2>/dev/null || true
    sudo ufw allow ${NGINX_HTTP_PORT}/tcp comment 'HTTP' 2>/dev/null || true
    sudo ufw allow ${NGINX_HTTPS_PORT}/tcp comment 'HTTPS' 2>/dev/null || true
    echo "✅ Порты ${NGINX_HTTP_PORT}, ${NGINX_HTTPS_PORT} открыты"
else
    echo "⚠️  UFW не установлен, пропуск настройки файрвола"
fi

echo ""
echo "=========================================="
echo "  ✅ ВСЕ ЗАВИСИМОСТИ УСТАНОВЛЕНЫ"
echo "=========================================="
echo ""
echo "Установлено:"
echo "  • MongoDB ${MONGODB_VERSION}"
echo "  • Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo "  • Docker Compose"
echo "  • Nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "  • Certbot $(certbot --version | cut -d' ' -f2)"
echo ""
