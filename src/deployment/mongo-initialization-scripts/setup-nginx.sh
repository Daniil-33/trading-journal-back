#!/bin/bash

# ============================================
# СКРИПТ НАСТРОЙКИ NGINX
# ============================================
# Настраивает Nginx как reverse proxy для mongo-express

set -e  # Остановка при ошибке

echo "=========================================="
echo "  НАСТРОЙКА NGINX"
echo "=========================================="
echo ""

# Проверка, что домен указан
if [ -z "$DOMAIN" ] || [ "$DOMAIN" == "db.wow-shop.xyz" ]; then
    echo "⚠️  ВНИМАНИЕ: Используется домен по умолчанию!"
    echo "   Домен: ${DOMAIN}"
    echo ""
    read -p "Продолжить? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Отменено. Измените DOMAIN в config.sh"
        exit 1
    fi
fi

echo "🌐 Настройка Nginx для домена: ${DOMAIN}"
echo ""

# Создание конфигурации Nginx
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
echo "📝 Создание конфигурации Nginx..."

sudo tee ${NGINX_CONF} > /dev/null <<EOF
# Конфигурация Nginx для mongo-express
# Домен: ${DOMAIN}
# Создано: $(date)

server {
    listen ${NGINX_HTTP_PORT};
    listen [::]:${NGINX_HTTP_PORT};
    server_name ${DOMAIN};

    # Логирование
    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;

    # Ограничение размера загружаемых файлов
    client_max_body_size 50M;

    # Reverse proxy для mongo-express
    location / {
        proxy_pass http://127.0.0.1:${MONGO_EXPRESS_PORT};
        proxy_http_version 1.1;
        
        # Заголовки для правильной работы WebSocket и проксирования
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        # Буферизация
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Дополнительная безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

echo "   ✅ Конфигурация создана: ${NGINX_CONF}"

# Создание символической ссылки
echo ""
echo "🔗 Активация конфигурации..."
sudo ln -sf ${NGINX_CONF} /etc/nginx/sites-enabled/${DOMAIN}
echo "   ✅ Символическая ссылка создана"

# Удаление дефолтной конфигурации (если есть)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "   Удаление дефолтной конфигурации..."
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# Проверка конфигурации Nginx
echo ""
echo "✅ Проверка конфигурации Nginx..."
if sudo nginx -t; then
    echo "   ✅ Конфигурация корректна"
else
    echo "   ❌ Ошибка в конфигурации!"
    exit 1
fi

# Перезапуск Nginx
echo ""
echo "🔄 Перезапуск Nginx..."
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx перезапущен"
else
    echo "   ❌ Ошибка при перезапуске Nginx"
    exit 1
fi

# Статус Nginx
echo ""
echo "📊 Статус Nginx:"
sudo systemctl status nginx --no-pager | grep -E "(Active|Loaded)" | head -2

echo ""
echo "=========================================="
echo "  ✅ NGINX НАСТРОЕН"
echo "=========================================="
echo ""
echo "Nginx настроен для домена: ${DOMAIN}"
echo "HTTP порт: ${NGINX_HTTP_PORT}"
echo ""
echo "Проверка доступности:"
echo "  curl -I http://${DOMAIN}"
echo ""
echo "Следующий шаг: Установка SSL сертификата"
echo "  ./setup-ssl.sh"
echo ""
