# Macro Analytics Backend API

Backend API для приложения Macro Analytics, построенный с использованием **Clean Architecture**.

## 🏗️ Архитектура

Проект следует принципам **Clean Architecture** с четким разделением слоев:

```
src/
├── domain/              # Domain Layer (бизнес-логика)
│   ├── entities/       # Сущности (User)
│   └── repositories/   # Интерфейсы репозиториев
├── application/         # Application Layer (use cases)
│   └── use-cases/      # Сценарии использования
│       ├── RegisterUser.ts
│       ├── LoginUser.ts
│       └── RefreshToken.ts
├── infrastructure/      # Infrastructure Layer (внешние зависимости)
│   ├── database/       # MongoDB модели и подключение
│   └── repositories/   # Реализация репозиториев
├── presentation/        # Presentation Layer (HTTP)
│   ├── controllers/    # Контроллеры
│   ├── middlewares/    # Мидлвары
│   └── routes/         # Маршруты
└── shared/             # Общие утилиты
    ├── utils/          # Вспомогательные функции
    └── types/          # Общие типы
```

## 🚀 Технологический стек

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **MongoDB** + **Mongoose** - база данных
- **JWT** - аутентификация
- **bcryptjs** - хеширование паролей

## 📋 Требования

- Node.js >= 18
- MongoDB >= 6.0

## ⚙️ Установка

```bash
cd market-backend

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактируйте .env файл

# Запустить MongoDB (если локально)
mongod

# Запустить сервер в режиме разработки
npm run dev
```

## 📝 Переменные окружения

```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/macro-analytics

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🔌 API Endpoints

### Authentication

#### POST `/api/auth/register`
Регистрация нового пользователя

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

#### POST `/api/auth/login`
Вход в систему

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "user@example.com"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### POST `/api/auth/refresh`
Обновление токенов

**Request:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "message": "Tokens refreshed successfully",
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### GET `/api/auth/profile`
Получение профиля (требует авторизации)

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "userId": "...",
    "email": "user@example.com"
  }
}
```

### Health Check

#### GET `/api/health`
Проверка состояния сервера

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T12:00:00.000Z"
}
```

## 🛠️ Скрипты

```bash
# Запуск в режиме разработки (с hot reload)
npm run dev

# Сборка проекта
npm run build

# Запуск production версии
npm run start
```

## 🏛️ Clean Architecture Principles

### Domain Layer (Ядро)
- **Entities**: Чистые бизнес-объекты (User)
- **Repository Interfaces**: Контракты для работы с данными
- **Не зависит от внешних библиотек**

### Application Layer (Сценарии)
- **Use Cases**: Бизнес-логика приложения
  - RegisterUserUseCase
  - LoginUserUseCase
  - RefreshTokenUseCase
- **Оркестрирует взаимодействие между слоями**

### Infrastructure Layer (Детали реализации)
- **Database**: MongoDB модели и подключение
- **Repositories**: Реализация интерфейсов из Domain
- **Внешние зависимости**: Mongoose, bcrypt, JWT

### Presentation Layer (HTTP/REST)
- **Controllers**: Обработка HTTP запросов
- **Routes**: Определение endpoints
- **Middlewares**: Аутентификация, обработка ошибок

## 🔒 Безопасность

- ✅ Пароли хешируются с помощью bcrypt (10 раундов)
- ✅ JWT токены с истечением срока действия
- ✅ Access Token: 7 дней
- ✅ Refresh Token: 30 дней
- ✅ CORS настроен для фронтенда
- ✅ Валидация входящих данных

## 📊 База данных

### User Collection
```typescript
{
  _id: ObjectId,
  email: string (unique, lowercase),
  password: string (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Тестирование API

### С помощью curl:

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Логин
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Профиль
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📝 Roadmap

### Этап 2
- [ ] Добавить макроэкономические индикаторы (CRUD)
- [ ] Реализовать подписку на обновления данных
- [ ] Добавить роли и permissions
- [ ] Интеграция с внешними API для получения данных

### Этап 3
- [ ] WebSocket для real-time обновлений
- [ ] Rate limiting
- [ ] Логирование (Winston)
- [ ] Unit и integration тесты

## 📄 Лицензия

MIT

---

**Версия:** 1.0.0  
**Дата:** Ноябрь 2025
