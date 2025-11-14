# Candle Data Import - Quick Start Guide

## 📋 Что реализовано

### 1. **Domain Layer** ✅
- `src/domain/entities/Candle.ts` - Сущность свечи с OHLCV массивом
- `src/domain/repositories/ICandleRepository.ts` - Интерфейс репозитория

### 2. **Infrastructure Layer** ✅
- `src/infrastructure/database/models/CandleModel.ts` - MongoDB схема с индексами
- `src/infrastructure/repositories/MongoCandleRepository.ts` - Реализация репозитория

### 3. **Application Layer** ✅
- `src/application/use-cases/ImportCandles.ts` - Бизнес-логика импорта с валидацией
- `src/application/use-cases/GetCandles.ts` - Получение свечей

### 4. **Utilities** ✅
- `src/shared/utils/csv-parser.ts` - Парсер CSV файлов

### 5. **Import Script** ✅
- `src/integrations/candles/import-candles.ts` - Скрипт импорта с прогрессом

## 🗄️ Структура данных

```typescript
interface ICandle {
    pair: string                    // "EURUSD", "GBPUSD", "USDJPY", "EURJPY"
    timeframe: Timeframe            // "5m", "15m", "30m", "1h", "4h", "1d", "1w"
    timestamp: Date                 // GMT timestamp
    ohlcv: [number, number, number, number, number]  // [Open, High, Low, Close, Volume]
}
```

### Преимущества OHLCV массива:
- **Компактность** - одно поле вместо пяти
- **Меньше места в БД** - MongoDB экономит на ключах
- **Быстрее передача** - меньше JSON
- **Индексация** - compound index: `{ pair: 1, timeframe: 1, timestamp: -1 }`
- **Уникальность** - unique constraint предотвращает дубликаты

## 📁 Формат CSV файлов

### Имя файла: `{PAIR}_{TIMEFRAME}.csv`
Примеры:
- `EURUSD_5m.csv`
- `EURUSD_1h.csv`
- `GBPUSD_1d.csv`
- `USDJPY_1w.csv`

### Формат данных:
```csv
Gmt time,Open,High,Low,Close,Volume
2024.01.01 00:00,1.1050,1.1055,1.1048,1.1052,100
2024.01.01 01:00,1.1052,1.1058,1.1051,1.1057,120
```

## 🚀 Как запустить импорт

### 1. Подготовка

```bash
# Убедитесь что MongoDB запущен
brew services start mongodb-community
# или
mongod --config /usr/local/etc/mongod.conf

# Создайте .env файл (если еще нет)
cp .env.example .env
```

### 2. Размещение CSV файлов

```bash
# Скопируйте ваши CSV файлы в папку candles-import/
cp /path/to/your/EURUSD_1h.csv candles-import/
cp /path/to/your/GBPUSD_1d.csv candles-import/
# ... остальные файлы
```

### 3. Запуск импорта

```bash
# Компиляция TypeScript
npm run build

# Запуск импорта
node dist/integrations/candles/import-candles.js
```

## 📊 Что делает импорт

1. **Подключение к MongoDB** 📡
2. **Сканирование папки** `candles-import/` 📁
3. **Парсинг CSV** для каждого файла ⚙️
4. **Валидация данных**:
   - Проверка OHLC отношений (high >= max(open,close), low <= min(open,close))
   - Проверка типов данных
   - Проверка таймстемпов
5. **Batch импорт** (по 10,000 свечей за раз) 💾
6. **Обработка дубликатов** - автоматически пропускает ⚠️
7. **Статистика** после импорта 📈

## 📈 Пример вывода

```
🚀 Candle Data Import Script Started
================================================================================
📡 Connecting to MongoDB...
✅ MongoDB connected

📁 Found 1 CSV file(s) to import:
   • EURUSD_1h.csv (EURUSD - 1h)

[1/1] Processing EURUSD_1h.csv...
--------------------------------------------------------------------------------
📄 File size: 0.00 MB
📝 Total lines: 11
⚙️  Parsing CSV...
✅ Parsed 10 candles in 0.02s
💾 Importing to MongoDB (batch size: 10,000)...
✅ Import completed in 0.15s
✅ Completed: EURUSD_1h.csv
   Inserted: 10
   Duplicates: 0
   Errors: 0
   Total in DB: 10
   Date range: 2024-01-01T00:00:00.000Z to 2024-01-01T09:00:00.000Z

================================================================================
🎉 IMPORT COMPLETED
================================================================================
📊 Total Files Processed: 1
✅ Total Candles Inserted: 10
⚠️  Total Duplicates Skipped: 0
❌ Total Errors: 0

📈 Database Summary:
--------------------------------------------------------------------------------
EURUSD 1h: 10 candles
```

## 🔍 Проверка импорта

После импорта можете проверить данные в MongoDB:

```bash
# Подключитесь к MongoDB
mongosh

# Выберите БД
use macro-analytics

# Проверьте количество свечей
db.candles.countDocuments()

# Проверьте примеры данных
db.candles.find().limit(5).pretty()

# Статистика по парам
db.candles.aggregate([
  {
    $group: {
      _id: { pair: "$pair", timeframe: "$timeframe" },
      count: { $sum: 1 },
      minDate: { $min: "$timestamp" },
      maxDate: { $max: "$timestamp" }
    }
  },
  { $sort: { "_id.pair": 1, "_id.timeframe": 1 } }
])
```

## 🎯 Следующие шаги

После успешного импорта можно:

1. **Создать API endpoints** для получения свечей:
   - `GET /api/candles/:pair/:timeframe` - получить свечи
   - `GET /api/candles/:pair/:timeframe/latest` - последняя свеча
   - `GET /api/candles/statistics` - статистика

2. **Создать WebSocket** для real-time обновлений

3. **Добавить агрегацию** таймфреймов (5m → 15m → 1h → 1d)

4. **Добавить индикаторы** (MA, RSI, MACD и т.д.)

## 🐛 Troubleshooting

### MongoDB не запускается
```bash
# Проверьте статус
brew services list

# Перезапустите
brew services restart mongodb-community
```

### Ошибка подключения
- Проверьте `.env` файл
- Убедитесь что `MONGODB_URI=mongodb://localhost:27017/macro-analytics`
- Проверьте что MongoDB слушает на порту 27017

### Файлы не импортируются
- Проверьте имя файла: должно быть `{PAIR}_{TIMEFRAME}.csv`
- Проверьте формат CSV: `Gmt time,Open,High,Low,Close,Volume`
- Первая строка может быть заголовком (автоматически пропускается)

## 📚 Документация

- [Candle Entity](../src/domain/entities/Candle.ts) - Определение сущности
- [Import Use Case](../src/application/use-cases/ImportCandles.ts) - Логика импорта
- [CSV Parser](../src/shared/utils/csv-parser.ts) - Парсинг CSV
- [Import Script](../src/integrations/candles/import-candles.ts) - Скрипт импорта

## ✅ Готово!

Система импорта полностью реализована и готова к работе с вашими 20 годами исторических данных! 🚀
