#!/bin/bash

# ============================================
# СКРИПТ РАЗВЕРТЫВАНИЯ MONGO-EXPRESS
# ============================================
# Создает и запускает mongo-express в Docker

set -e  # Остановка при ошибке

echo "=========================================="
echo "  РАЗВЕРТЫВАНИЕ MONGO-EXPRESS"
echo "=========================================="
echo ""

# Создание директории для docker-compose файла
WORK_DIR="/opt/mongo-express"
echo "📁 Создание рабочей директории: ${WORK_DIR}"
sudo mkdir -p ${WORK_DIR}

# Создание docker-compose.yml
echo "📝 Создание docker-compose.yml..."
sudo tee ${WORK_DIR}/docker-compose.yml > /dev/null <<EOF
version: '3.8'

services:
  mongo-express:
    image: mongo-express:${MONGO_EXPRESS_VERSION}
    container_name: mongo-express
    restart: always
    ports:
      - "127.0.0.1:${MONGO_EXPRESS_PORT}:8081"
    environment:
      # Настройки подключения к MongoDB с аутентификацией
      ME_CONFIG_MONGODB_URL: "mongodb://${MONGO_USER}:${MONGO_PASSWORD}@172.17.0.1:${MONGO_PORT}/?authSource=admin"
      
      # Базовая аутентификация для веб-интерфейса
      ME_CONFIG_BASICAUTH_USERNAME: ${ADMIN_USER}
      ME_CONFIG_BASICAUTH_PASSWORD: ${ADMIN_PASSWORD}
      
      # Название сайта в интерфейсе
      ME_CONFIG_SITE_BASEURL: /
      ME_CONFIG_SITE_COOKIESECRET: $(openssl rand -hex 16)
      ME_CONFIG_SITE_SESSIONSECRET: $(openssl rand -hex 16)
      
    network_mode: bridge
    
    # Ограничения ресурсов (опционально)
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
EOF

echo "   ✅ docker-compose.yml создан"

# Остановка существующего контейнера (если есть)
echo ""
echo "🔄 Проверка существующих контейнеров..."
if docker ps -a | grep -q mongo-express; then
    echo "   Остановка и удаление старого контейнера..."
    cd ${WORK_DIR}
    docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    echo "   ✅ Старый контейнер удален"
fi

# Запуск mongo-express
echo ""
echo "🚀 Запуск mongo-express..."
cd ${WORK_DIR}
docker compose up -d

# Ожидание запуска
echo "   Ожидание запуска контейнера..."
sleep 5

# Проверка статуса
echo ""
echo "📊 Статус контейнера:"
docker ps | grep mongo-express || echo "   ❌ Контейнер не запущен"

# Проверка логов
echo ""
echo "📋 Последние логи mongo-express:"
docker logs mongo-express --tail 10

# Проверка доступности
echo ""
echo "🔌 Проверка доступности на порту ${MONGO_EXPRESS_PORT}..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${MONGO_EXPRESS_PORT} | grep -q "401"; then
    echo "   ✅ mongo-express отвечает (требует авторизацию)"
else
    echo "   ⚠️  mongo-express может быть еще не готов, проверьте логи"
fi

echo ""
echo "=========================================="
echo "  ✅ MONGO-EXPRESS РАЗВЕРНУТ"
echo "=========================================="
echo ""
echo "mongo-express работает на порту: ${MONGO_EXPRESS_PORT}"
echo "Доступен локально: http://localhost:${MONGO_EXPRESS_PORT}"
echo ""
echo "Учетные данные для входа:"
echo "  Логин: ${ADMIN_USER}"
echo "  Пароль: ${ADMIN_PASSWORD}"
echo ""
echo "Управление контейнером:"
echo "  Логи:        docker logs mongo-express -f"
echo "  Перезапуск:  cd ${WORK_DIR} && docker compose restart"
echo "  Остановка:   cd ${WORK_DIR} && docker compose down"
echo "  Запуск:      cd ${WORK_DIR} && docker compose up -d"
echo ""
