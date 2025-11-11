# Документация Backend API

## 📚 Содержание

### API Документация
- **[README.md](README.md)** - Полная документация Backend API
  - Архитектура Clean Architecture
  - Технологический стек
  - API Endpoints
  - Установка и настройка
  - Безопасность
  - База данных
  - Тестирование
  - Roadmap

## 🏗️ Архитектура

Backend построен по принципам **Clean Architecture** с разделением на слои:

```
Domain Layer        → Бизнес-логика (entities, repositories)
Application Layer   → Use Cases (RegisterUser, LoginUser, RefreshToken)
Infrastructure      → MongoDB, реализации репозиториев
Presentation        → HTTP слой (controllers, routes, middlewares)
```

## 🔌 API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токенов
- `GET /api/auth/profile` - Профиль (защищен)

### Health Check
- `GET /api/health` - Проверка состояния

## 🚀 Быстрые ссылки

- [Вернуться к главному README](../README.md)
- [Frontend документация](../../market-front/docs/)

---

Для детальной информации см. [полную документацию API](README.md)
