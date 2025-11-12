#!/bin/bash

# ============================================
# ГЛАВНЫЙ СКРИПТ РАЗВЕРТЫВАНИЯ
# ============================================
# Полное развертывание MongoDB + mongo-express + Nginx + SSL

set -e  # Остановка при ошибке

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_step() {
    echo -e "${BLUE}=========================================="
    echo -e "  $1"
    echo -e "==========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Загрузка конфигурации
if [ ! -f "${SCRIPT_DIR}/config.sh" ]; then
    print_error "Файл config.sh не найден!"
    exit 1
fi

source "${SCRIPT_DIR}/config.sh"

# Приветствие
clear
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     АВТОМАТИЧЕСКОЕ РАЗВЕРТЫВАНИЕ MONGODB + MONGO-EXPRESS    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "Этот скрипт выполнит полное развертывание системы:"
echo ""
echo "  1️⃣  Установка зависимостей (MongoDB, Docker, Nginx, Certbot)"
echo "  2️⃣  Настройка MongoDB и создание пользователя"
echo "  3️⃣  Развертывание mongo-express в Docker"
echo "  4️⃣  Настройка Nginx как reverse proxy"
echo "  5️⃣  Установка SSL сертификата (Let's Encrypt)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Конфигурация:"
echo "  • Сервер:          ${SERVER_IP}"
echo "  • Домен:           ${DOMAIN}"
echo "  • Email:           ${EMAIL}"
echo "  • MongoDB порт:    ${MONGO_PORT}"
echo "  • Пользователь:    ${MONGO_USER}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Проверка, запущен ли скрипт на целевом сервере
CURRENT_IP=$(hostname -I | awk '{print $1}' || echo "unknown")
if [ "$CURRENT_IP" != "$SERVER_IP" ] && [ "$CURRENT_IP" != "unknown" ]; then
    print_warning "Этот скрипт запущен НЕ на целевом сервере!"
    echo "   Текущий IP: ${CURRENT_IP}"
    echo "   Ожидается:  ${SERVER_IP}"
    echo ""
    echo "   Возможно вы хотите:"
    echo "   • Изменить SERVER_IP в config.sh"
    echo "   • Скопировать скрипты на сервер и запустить там"
    echo ""
fi

read -p "Начать установку? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Отменено"
    exit 0
fi

echo ""
START_TIME=$(date +%s)

# ============================================
# ШАГ 1: УСТАНОВКА ЗАВИСИМОСТЕЙ
# ============================================
print_step "ШАГ 1/5: УСТАНОВКА ЗАВИСИМОСТЕЙ"
echo ""

if bash "${SCRIPT_DIR}/install-dependencies.sh"; then
    print_success "Зависимости установлены"
else
    print_error "Ошибка при установке зависимостей"
    exit 1
fi

echo ""
read -p "Нажмите Enter для продолжения..."

# ============================================
# ШАГ 2: НАСТРОЙКА MONGODB
# ============================================
print_step "ШАГ 2/5: НАСТРОЙКА MONGODB"
echo ""

if bash "${SCRIPT_DIR}/setup-mongodb.sh"; then
    print_success "MongoDB настроен"
else
    print_error "Ошибка при настройке MongoDB"
    exit 1
fi

echo ""
read -p "Нажмите Enter для продолжения..."

# ============================================
# ШАГ 3: РАЗВЕРТЫВАНИЕ MONGO-EXPRESS
# ============================================
print_step "ШАГ 3/5: РАЗВЕРТЫВАНИЕ MONGO-EXPRESS"
echo ""

if bash "${SCRIPT_DIR}/setup-mongo-express.sh"; then
    print_success "mongo-express развернут"
else
    print_error "Ошибка при развертывании mongo-express"
    exit 1
fi

echo ""
read -p "Нажмите Enter для продолжения..."

# ============================================
# ШАГ 4: НАСТРОЙКА NGINX
# ============================================
print_step "ШАГ 4/5: НАСТРОЙКА NGINX"
echo ""

if bash "${SCRIPT_DIR}/setup-nginx.sh"; then
    print_success "Nginx настроен"
else
    print_error "Ошибка при настройке Nginx"
    exit 1
fi

echo ""
read -p "Нажмите Enter для продолжения..."

# ============================================
# ШАГ 5: УСТАНОВКА SSL
# ============================================
print_step "ШАГ 5/5: УСТАНОВКА SSL СЕРТИФИКАТА"
echo ""

print_warning "Убедитесь, что DNS запись настроена!"
echo "   A-запись: ${DOMAIN} -> ${SERVER_IP}"
echo ""
read -p "DNS настроен? Продолжить установку SSL? (yes/no): " ssl_confirm

if [ "$ssl_confirm" == "yes" ]; then
    if bash "${SCRIPT_DIR}/setup-ssl.sh"; then
        print_success "SSL сертификат установлен"
        SSL_INSTALLED=true
    else
        print_warning "SSL не установлен, но можно установить позже"
        print_warning "Запустите: ./setup-ssl.sh"
        SSL_INSTALLED=false
    fi
else
    print_warning "Установка SSL пропущена"
    print_warning "Вы можете установить SSL позже: ./setup-ssl.sh"
    SSL_INSTALLED=false
fi

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo ""
print_step "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo ""
echo "⏱️  Время выполнения: ${MINUTES} мин ${SECONDS} сек"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 ИНФОРМАЦИЯ О СИСТЕМЕ:"
echo ""
echo "  🗄️  MongoDB:"
echo "     • Порт: ${MONGO_PORT}"
echo "     • Пользователь: ${MONGO_USER}"
echo "     • Строка подключения:"
echo "       mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${SERVER_IP}:${MONGO_PORT}/?authSource=admin"
echo ""
echo "  🌐 mongo-express:"
if [ "$SSL_INSTALLED" = true ]; then
    echo "     • URL: https://${DOMAIN}"
else
    echo "     • URL: http://${DOMAIN}"
fi
echo "     • Логин: ${ADMIN_USER}"
echo "     • Пароль: ${ADMIN_PASSWORD}"
echo ""
echo "  📁 Файлы:"
echo "     • docker-compose: /opt/mongo-express/docker-compose.yml"
echo "     • Nginx config: /etc/nginx/sites-available/${DOMAIN}"
echo "     • MongoDB config: /etc/mongod.conf"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 ПОЛЕЗНЫЕ КОМАНДЫ:"
echo ""
echo "  MongoDB:"
echo "    sudo systemctl status mongod"
echo "    mongosh admin -u ${MONGO_USER} -p ${MONGO_PASSWORD}"
echo ""
echo "  mongo-express:"
echo "    docker logs mongo-express -f"
echo "    cd /opt/mongo-express && docker compose restart"
echo ""
echo "  Nginx:"
echo "    sudo systemctl status nginx"
echo "    sudo nginx -t"
echo ""
if [ "$SSL_INSTALLED" = true ]; then
echo "  SSL:"
echo "    sudo certbot certificates"
echo "    sudo certbot renew --dry-run"
echo ""
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SSL_INSTALLED" = true ]; then
    print_success "Откройте браузер: https://${DOMAIN}"
else
    print_success "Откройте браузер: http://${DOMAIN}"
    print_warning "Не забудьте установить SSL: ./setup-ssl.sh"
fi

echo ""
