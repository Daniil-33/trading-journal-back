# 🚀 Быстрый старт

## Пошаговая инструкция на 5 минут

### Шаг 1: Настройте DNS
```
Тип: A
Имя: db (или ваш поддомен)
Значение: IP вашего VPS
```

### Шаг 2: Скопируйте скрипты на сервер
```bash
scp -r deployment-scripts/ root@your-server-ip:~/
```

### Шаг 3: Подключитесь к серверу
```bash
ssh root@your-server-ip
cd deployment-scripts
```

### Шаг 4: Отредактируйте конфигурацию
```bash
nano config.sh
```

Измените:
- `SERVER_IP` - ваш IP
- `DOMAIN` - ваш домен
- `EMAIL` - ваш email
- `MONGO_USER` и `MONGO_PASSWORD` - учетные данные MongoDB
- `ADMIN_USER` и `ADMIN_PASSWORD` - учетные данные веб-интерфейса

### Шаг 5: Запустите установку
```bash
./deploy.sh
```

### Шаг 6: Откройте в браузере
```
https://ваш-домен
```

Войдите с учетными данными из `config.sh`

---

## Полезные команды

### Управление MongoDB
```bash
sudo systemctl status mongod       # Статус
sudo systemctl restart mongod      # Перезапуск
mongosh admin -u user -p password  # Подключение
```

### Управление mongo-express
```bash
docker ps | grep mongo-express     # Статус
docker logs mongo-express -f       # Логи
cd /opt/mongo-express && docker compose restart  # Перезапуск
```

### Управление Nginx
```bash
sudo systemctl status nginx        # Статус
sudo nginx -t                      # Проверка конфигурации
sudo systemctl reload nginx        # Перезагрузка
```

### SSL сертификаты
```bash
sudo certbot certificates          # Список сертификатов
sudo certbot renew --dry-run       # Тест обновления
```

---

## Файлы на сервере

- **MongoDB config:** `/etc/mongod.conf`
- **mongo-express:** `/opt/mongo-express/docker-compose.yml`
- **Nginx config:** `/etc/nginx/sites-available/ваш-домен`
- **Логи Nginx:** `/var/log/nginx/ваш-домен_*.log`

---

## Устранение проблем

### MongoDB не запускается
```bash
sudo journalctl -u mongod -n 50
sudo systemctl restart mongod
```

### mongo-express не работает
```bash
docker logs mongo-express --tail 50
cd /opt/mongo-express && docker compose restart
```

### SSL не устанавливается
```bash
# Проверьте DNS
dig @8.8.8.8 ваш-домен

# Подождите 10-30 минут после настройки DNS
# Затем попробуйте снова
./setup-ssl.sh
```

---

## Резервное копирование

```bash
# Создать бэкап
mongodump --uri="mongodb://user:password@localhost:27017/?authSource=admin" \
  --archive=/backup/backup-$(date +%Y%m%d).gz --gzip

# Восстановить бэкап
mongorestore --uri="mongodb://user:password@localhost:27017/?authSource=admin" \
  --archive=/backup/backup-20240101.gz --gzip
```

---

## Удаление

⚠️ **ВНИМАНИЕ:** Удаляет все данные!

```bash
./uninstall.sh
```

---

## Помощь

Полная документация: `README.md`

Конфигурация: `config.sh`

Отдельные скрипты:
- `install-dependencies.sh` - Установка зависимостей
- `setup-mongodb.sh` - Настройка MongoDB
- `setup-mongo-express.sh` - Установка mongo-express
- `setup-nginx.sh` - Настройка Nginx
- `setup-ssl.sh` - Установка SSL
- `deploy.sh` - Полная установка
- `uninstall.sh` - Удаление
