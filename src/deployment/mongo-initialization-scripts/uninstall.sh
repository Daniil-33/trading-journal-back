#!/bin/bash

# ============================================
# СКРИПТ УДАЛЕНИЯ ВСЕЙ УСТАНОВКИ
# ============================================
# ВНИМАНИЕ: Удаляет MongoDB, mongo-express и все данные!

set -e

echo "=========================================="
echo "  ⚠️  УДАЛЕНИЕ УСТАНОВКИ"
echo "=========================================="
echo ""
echo "Этот скрипт удалит:"
echo "  • MongoDB (включая все базы данных)"
echo "  • mongo-express контейнер"
echo "  • Nginx конфигурацию"
echo "  • SSL сертификаты"
echo ""
echo "❌ ВНИМАНИЕ: Все данные в MongoDB будут потеряны!"
echo ""

read -p "Вы уверены? Введите 'DELETE' для подтверждения: " confirm

if [ "$confirm" != "DELETE" ]; then
    echo "Отменено"
    exit 0
fi

echo ""
echo "🗑️  Начинаем удаление..."
echo ""

# Загрузка конфигурации
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/config.sh" ]; then
    source "${SCRIPT_DIR}/config.sh"
fi

# Остановка и удаление mongo-express
echo "1️⃣  Удаление mongo-express..."
if [ -d "/opt/mongo-express" ]; then
    cd /opt/mongo-express
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    docker rm -f mongo-express 2>/dev/null || true
    sudo rm -rf /opt/mongo-express
    echo "   ✅ mongo-express удален"
else
    echo "   ℹ️  mongo-express не установлен"
fi

# Остановка и удаление MongoDB
echo ""
echo "2️⃣  Удаление MongoDB..."
if command -v mongod &> /dev/null; then
    sudo systemctl stop mongod 2>/dev/null || true
    sudo systemctl disable mongod 2>/dev/null || true
    sudo apt-get remove --purge -y mongodb-org* 2>/dev/null || true
    sudo rm -rf /var/log/mongodb
    sudo rm -rf /var/lib/mongodb
    sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list
    echo "   ✅ MongoDB удален"
else
    echo "   ℹ️  MongoDB не установлен"
fi

# Удаление Nginx конфигурации
echo ""
echo "3️⃣  Удаление Nginx конфигурации..."
if [ -n "$DOMAIN" ] && [ -f "/etc/nginx/sites-available/${DOMAIN}" ]; then
    sudo rm -f /etc/nginx/sites-available/${DOMAIN}
    sudo rm -f /etc/nginx/sites-enabled/${DOMAIN}
    sudo nginx -t && sudo systemctl reload nginx
    echo "   ✅ Конфигурация Nginx удалена"
else
    echo "   ℹ️  Конфигурация Nginx не найдена"
fi

# Удаление SSL сертификатов
echo ""
echo "4️⃣  Удаление SSL сертификатов..."
if [ -n "$DOMAIN" ] && command -v certbot &> /dev/null; then
    sudo certbot delete --cert-name ${DOMAIN} --non-interactive 2>/dev/null || true
    echo "   ✅ SSL сертификаты удалены"
else
    echo "   ℹ️  SSL сертификаты не найдены"
fi

echo ""
echo "=========================================="
echo "  ✅ УДАЛЕНИЕ ЗАВЕРШЕНО"
echo "=========================================="
echo ""
echo "Что осталось установленным:"
echo "  • Docker (можно удалить: sudo apt-get remove docker-ce docker-ce-cli)"
echo "  • Nginx (можно удалить: sudo apt-get remove nginx)"
echo "  • Certbot (можно удалить: sudo apt-get remove certbot)"
echo ""
echo "Для полной переустановки запустите: ./deploy.sh"
echo ""
