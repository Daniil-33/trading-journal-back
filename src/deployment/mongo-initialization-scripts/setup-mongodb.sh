#!/bin/bash

# ============================================
# СКРИПТ НАСТРОЙКИ MONGODB
# ============================================
# Настраивает MongoDB и создает пользователя

set -e  # Остановка при ошибке

echo "=========================================="
echo "  НАСТРОЙКА MONGODB"
echo "=========================================="
echo ""

# Проверка, что MongoDB запущен
if ! sudo systemctl is-active --quiet mongod; then
    echo "❌ MongoDB не запущен. Запускаем..."
    sudo systemctl start mongod
    sleep 3
fi

echo "📊 MongoDB запущен на порту ${MONGO_PORT}"
echo ""

# Настройка MongoDB для прослушивания на всех интерфейсах
echo "🔧 Настройка сетевых параметров MongoDB..."
MONGO_CONF="/etc/mongod.conf"

# Проверка текущей настройки bindIp
CURRENT_BIND_IP=$(grep -E "^\s*bindIp:" $MONGO_CONF | awk '{print $2}' || echo "")

if [ "$CURRENT_BIND_IP" != "0.0.0.0" ]; then
    echo "   Изменение bindIp на 0.0.0.0..."
    sudo sed -i 's/bindIp:.*/bindIp: 0.0.0.0/' $MONGO_CONF
    NEED_RESTART=true
else
    echo "   ✅ bindIp уже настроен на 0.0.0.0"
    NEED_RESTART=false
fi

# Проверка, включена ли авторизация
AUTH_ENABLED=$(grep -E "^\s*authorization:\s*enabled" $MONGO_CONF || echo "")

if [ -z "$AUTH_ENABLED" ]; then
    echo "   Авторизация не включена, создаем пользователя без авторизации..."
    
    # Перезапуск MongoDB если изменили bindIp
    if [ "$NEED_RESTART" = true ]; then
        echo "   Перезапуск MongoDB..."
        sudo systemctl restart mongod
        sleep 5
    fi
    
    echo ""
    echo "👤 Создание пользователя MongoDB..."
    echo "   Имя пользователя: ${MONGO_USER}"
    
    # Проверка, существует ли пользователь
    USER_EXISTS=$(mongosh admin --quiet --eval "db.getUser('${MONGO_USER}')" 2>/dev/null || echo "null")
    
    if [[ "$USER_EXISTS" == "null" ]]; then
        echo "   Создание нового пользователя..."
        mongosh admin --quiet --eval "
            db.createUser({
                user: '${MONGO_USER}',
                pwd: '${MONGO_PASSWORD}',
                roles: [
                    { role: 'root', db: 'admin' },
                    { role: 'readWriteAnyDatabase', db: 'admin' }
                ]
            })
        "
        echo "   ✅ Пользователь ${MONGO_USER} создан"
    else
        echo "   ℹ️  Пользователь ${MONGO_USER} уже существует"
        echo "   Обновление пароля..."
        mongosh admin --quiet --eval "
            db.updateUser('${MONGO_USER}', {
                pwd: '${MONGO_PASSWORD}'
            })
        "
        echo "   ✅ Пароль обновлен"
    fi
    
    echo ""
    echo "🔒 Включение авторизации..."
    # Добавление настройки авторизации в конфиг
    if ! grep -q "^security:" $MONGO_CONF; then
        echo "security:" | sudo tee -a $MONGO_CONF > /dev/null
        echo "  authorization: enabled" | sudo tee -a $MONGO_CONF > /dev/null
    else
        sudo sed -i '/^security:/,/^[a-zA-Z]/ s/authorization:.*/  authorization: enabled/' $MONGO_CONF
    fi
    
    echo "   Перезапуск MongoDB с включенной авторизацией..."
    sudo systemctl restart mongod
    sleep 5
    
else
    echo "   ✅ Авторизация уже включена"
    
    # Перезапуск MongoDB если изменили bindIp
    if [ "$NEED_RESTART" = true ]; then
        echo "   Перезапуск MongoDB..."
        sudo systemctl restart mongod
        sleep 5
    fi
    
    echo ""
    echo "👤 Проверка пользователя MongoDB..."
    
    # Попытка подключиться с существующими учетными данными
    USER_CHECK=$(mongosh admin -u "${MONGO_USER}" -p "${MONGO_PASSWORD}" --quiet --eval "db.runCommand({ connectionStatus: 1 })" 2>/dev/null || echo "failed")
    
    if [[ "$USER_CHECK" == "failed" ]]; then
        echo "   ⚠️  Не удалось подключиться с учетными данными из config.sh"
        echo "   Возможно, пользователь не существует или пароль неверный"
        echo ""
        echo "   Если вы хотите создать/обновить пользователя, выполните:"
        echo "   1. Временно отключите авторизацию в /etc/mongod.conf"
        echo "   2. Перезапустите скрипт"
        exit 1
    else
        echo "   ✅ Пользователь ${MONGO_USER} существует и работает"
    fi
fi

# Проверка статуса MongoDB
echo ""
echo "📊 Статус MongoDB:"
sudo systemctl status mongod --no-pager | grep -E "(Active|Main PID)" | head -2

echo ""
echo "🔌 Проверка портов:"
sudo netstat -tlnp | grep ${MONGO_PORT} || echo "   ⚠️  Порт ${MONGO_PORT} не прослушивается"

echo ""
echo "=========================================="
echo "  ✅ MONGODB НАСТРОЕН"
echo "=========================================="
echo ""
echo "MongoDB работает на порту: ${MONGO_PORT}"
echo "Пользователь: ${MONGO_USER}"
echo "База данных: admin"
echo ""
echo "Строка подключения:"
echo "mongodb://${MONGO_USER}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}/?authSource=admin"
echo ""
