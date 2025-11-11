# Macro Analytics Backend API

REST API сервер с Clean Architecture для приложения Macro Analytics.

## 🚀 Быстрый старт

```bash
npm install
npm run dev
```

API запустится на `http://localhost:3000`

## 📚 Документация

Полная документация API: **[docs/README.md](docs/README.md)**

## 🛠️ Основные команды

```bash
npm run dev        # Запуск dev сервера с hot reload
npm run build      # Сборка TypeScript
npm run start      # Запуск production сервера
```

## ⚙️ Настройка

Скопируйте `.env.example` в `.env` и настройте переменные:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/macro-analytics
JWT_SECRET=your_secret_key
```

## 🏗️ Clean Architecture

```
src/
├── domain/              # Бизнес-логика
│   ├── entities/
│   └── repositories/
├── application/         # Use Cases
│   └── use-cases/
├── infrastructure/      # MongoDB, реализации
│   ├── database/
│   └── repositories/
├── presentation/        # HTTP слой
│   ├── controllers/
│   ├── routes/
│   └── middlewares/
└── shared/             # Утилиты
```

## 🔌 API Endpoints

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токенов
- `GET /api/auth/profile` - Профиль (защищен)
- `GET /api/health` - Health check

## 📋 Требования

- Node.js >= 18
- MongoDB >= 6.0

---

Для детальной информации см. [полную документацию](docs/README.md)
