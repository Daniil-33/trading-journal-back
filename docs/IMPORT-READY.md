# 🎯 Импорт Ваших Данных - Готово к Запуску!

## ✅ Что Реализовано

### Архитектура (Clean Architecture)
```
domain/
  ├── entities/Candle.ts              - Сущность свечи с OHLCV массивом
  └── repositories/ICandleRepository.ts - Интерфейс репозитория

infrastructure/
  ├── database/models/CandleModel.ts  - MongoDB схема с индексами
  └── repositories/MongoCandleRepository.ts - Реализация

application/
  └── use-cases/
      ├── ImportCandles.ts            - Логика импорта с валидацией
      └── GetCandles.ts               - Получение свечей

shared/
  └── utils/csv-parser.ts             - Парсер CSV

integrations/candles/
  ├── import-from-folders.ts          - ⭐ Основной скрипт импорта
  ├── import-candles.ts               - Альтернативный (простая структура)
  └── check-candles.ts                - Проверка импортированных данных
```

### Оптимизации

✅ **OHLCV массив**: `[Open, High, Low, Close, Volume]` вместо 5 полей  
✅ **Compound Index**: `{ pair: 1, timeframe: 1, timestamp: -1 }` для быстрых запросов  
✅ **Unique Constraint**: `{ pair: 1, timeframe: 1, timestamp: 1 }` предотвращает дубликаты  
✅ **Batch Processing**: импорт по 10,000 свечей за раз  
✅ **Валидация**: проверка OHLC отношений, типов, диапазонов  

## 🚀 Запуск Импорта

### Шаг 1: Запустите MongoDB

```bash
# Проверьте статус
brew services list

# Запустите если нужно
brew services start mongodb-community

# Или вручную
mongod --config /usr/local/etc/mongod.conf
```

### Шаг 2: Проверьте .env

```bash
# Создайте если еще нет
cp .env.example .env

# Убедитесь что есть строка:
# MONGODB_URI=mongodb://localhost:27017/macro-analytics
```

### Шаг 3: Запустите Импорт

```bash
# Компиляция
npm run build

# Импорт из вашей структуры папок (EURUSD/h1/файлы.csv)
node dist/integrations/candles/import-from-folders.js
```

## 📁 Ваша Структура Данных

Скрипт автоматически обработает:

```
src/integrations/candles-import/
  EURUSD/
    m5/  → timeframe: 5m
      EURUSD_Candlestick_5_M_BID_01.01.2024-31.12.2024.csv
      EURUSD_Candlestick_5_M_BID_01.01.2025-31.10.2025.csv
    m15/ → timeframe: 15m
    m30/ → timeframe: 30m
    h1/  → timeframe: 1h
    h4/  → timeframe: 4h
    d1/  → timeframe: 1d
    w1/  → timeframe: 1w
  GBPUSD/
    ...
  USDJPY/
    ...
  EURJPY/
    ...
```

## 📊 Ожидаемый Результат

```
🚀 Advanced Candle Data Import Script
================================================================================
📂 Import folder: /path/to/candles-import

📡 Connecting to MongoDB...
✅ MongoDB connected

🔍 Scanning for CSV files...

📁 Found 14 CSV file(s) across 7 datasets:

   EURUSD 5m: 2 file(s)
   EURUSD 15m: 2 file(s)
   EURUSD 30m: 2 file(s)
   EURUSD 1h: 2 file(s)
   EURUSD 4h: 2 file(s)
   EURUSD 1d: 2 file(s)
   EURUSD 1w: 2 file(s)

[1/7] Processing EURUSD 5m (2 files)
================================================================================

  File 1/2: EURUSD_Candlestick_5_M_BID_01.01.2024-31.12.2024.csv
  ----------------------------------------------------------------------------
  ✅ Inserted: 105,120
  ⚠️  Duplicates: 0

  File 2/2: EURUSD_Candlestick_5_M_BID_01.01.2025-31.10.2025.csv
  ----------------------------------------------------------------------------
  ✅ Inserted: 87,600
  ⚠️  Duplicates: 0

  📊 Dataset Summary:
  ----------------------------------------------------------------------------
  Total Inserted: 192,720
  Total Duplicates: 0
  Total Errors: 0
  Total in DB: 192,720
  Date range: 2024-01-01 to 2025-10-31 (669 days)

...

================================================================================
🎉 IMPORT COMPLETED
================================================================================
📊 Total Datasets: 7
📄 Total Files Processed: 14
✅ Total Candles Inserted: 1,234,567
⚠️  Total Duplicates Skipped: 0
❌ Total Errors: 0

📈 Final Database Summary:
================================================================================

EURUSD:
  5m  :    192,720 candles
  15m :     64,240 candles
  30m :     32,120 candles
  1h  :     16,060 candles
  4h  :      4,015 candles
  1d  :        669 candles
  1w  :         95 candles
```

## 🔍 Проверка Результатов

### Скрипт проверки статистики

```bash
node dist/integrations/candles/check-candles.js
```

### MongoDB Shell

```bash
mongosh

use macro-analytics

# Общее количество
db.candles.countDocuments()

# Примеры данных
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

# Проверка индексов
db.candles.getIndexes()

# Проверка размера коллекции
db.candles.stats()
```

## ⚡ Производительность

### Ожидаемая скорость импорта:
- **5m данные**: ~100,000 свечей = 10-15 секунд
- **1h данные**: ~10,000 свечей = 1-2 секунды
- **1d данные**: ~300 свечей = <1 секунда

### Оценка для полного импорта:
- **2 года × 4 пары × 7 TF** ≈ 2-3 млн свечей
- **Время импорта**: ~5-10 минут
- **Размер в БД**: ~200-300 MB

## 🔧 Troubleshooting

### MongoDB не подключается
```bash
# Проверьте что MongoDB запущен
brew services list | grep mongodb

# Проверьте порт
lsof -i :27017

# Перезапустите
brew services restart mongodb-community
```

### Ошибки парсинга CSV
- Проверьте формат даты: должно быть `DD.MM.YYYY HH:mm:ss.SSS`
- Проверьте заголовок: `Gmt time,Open,High,Low,Close,Volume`
- Убедитесь что файл в UTF-8

### Дубликаты при повторном импорте
- Это нормально! Unique constraint автоматически пропускает
- Счетчик "Duplicates" покажет сколько пропущено
- База данных остается консистентной

## 📚 Дополнительные Скрипты

### Импорт из простой структуры (PAIR_TF.csv)
```bash
# Если у вас файлы вида: EURUSD_1h.csv, GBPUSD_1d.csv
node dist/integrations/candles/import-candles.js
```

### Проверка статистики
```bash
node dist/integrations/candles/check-candles.js
```

## 🎯 Следующие Шаги

После импорта данных:

1. **API Endpoints** - создать REST API для получения свечей
2. **WebSocket** - real-time обновления
3. **Агрегация** - расчет старших TF из младших
4. **Индикаторы** - добавить MA, RSI, MACD и т.д.
5. **Бэктестинг** - система для тестирования стратегий

## ✅ Все Готово!

Запускайте импорт:

```bash
npm run build && node dist/integrations/candles/import-from-folders.js
```

🚀 **Успешного импорта!**
