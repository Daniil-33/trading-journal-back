# API Endpoints Documentation

## Indicators API

### Base URL
```
http://localhost:3001/api
```

---

## Endpoints

### 1. Get All Indicators
Получить список всех индикаторов с фильтрами.

**Endpoint:** `GET /indicators`

**Query Parameters:**
- `country` (optional) - Код страны (например: "US", "UK", "JN")
- `impact` (optional) - Уровень влияния: "low", "medium", "high"
- `currencies` (optional) - Валюты через запятую (например: "USD,EUR,GBP")

**Example Request:**
```bash
curl "http://localhost:3001/api/indicators?country=US&impact=high"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 87
}
```

---

### 2. Get Indicator by ID ✨ NEW
Получить конкретный индикатор по ID со всеми деталями (включая specs).

**Endpoint:** `GET /indicators/:id`

**Path Parameters:**
- `id` (required) - ID индикатора

**Example Request:**
```bash
curl "http://localhost:3001/api/indicators/6914be303fd4ff95cff5e8a7"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6914be303fd4ff95cff5e8a7",
    "name": "BRC Shop Price Index y/y",
    "country": "UK",
    "impact": "low",
    "frequency": "annual",
    "publishingTime": "certain",
    "affectedCurrencies": ["GBP"],
    "affectedPairs": ["GBPUSD", "EURGBP", "GBPJPY", "GBPCHF", "GBPAUD"],
    "title": "UK BRC Shop Price Index y/y",
    "info": [
      {
        "order": -10,
        "title": "Source",
        "html": "<a href=\"...\">British Retail Consortium</a>"
      },
      {
        "order": 10,
        "title": "Measures",
        "html": "Change in the price of goods purchased at BRC-member retail stores;"
      }
    ],
    "forexFactoryId": "116",
    "createdAt": "2025-11-12T17:04:48.143Z",
    "updatedAt": "2025-11-12T18:59:58.605Z"
  }
}
```

---

### 3. Get Publications Statistics ✨ NEW
Получить статистику публикаций индикатора за указанный период времени.

**Endpoint:** `GET /indicators/publications/statistics`

**Query Parameters:**
- `indicatorId` (optional) - ID индикатора для фильтрации
- `startDate` (optional) - Начальная дата (ISO 8601: "2024-01-01")
- `endDate` (optional) - Конечная дата (ISO 8601: "2024-12-31")
- `limit` (optional) - Максимальное количество записей (default: 100)
- `skip` (optional) - Пропустить N записей (для пагинации)

**Example Request 1 - Все публикации:**
```bash
curl "http://localhost:3001/api/indicators/publications/statistics?limit=10"
```

**Example Request 2 - По индикатору:**
```bash
curl "http://localhost:3001/api/indicators/publications/statistics?indicatorId=6914be303fd4ff95cff5e8a7&limit=20"
```

**Example Request 3 - С диапазоном дат:**
```bash
curl "http://localhost:3001/api/indicators/publications/statistics?indicatorId=6914be303fd4ff95cff5e8a7&startDate=2024-01-01&endDate=2024-12-31&limit=50"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "withActual": 10,
    "withForecast": 7,
    "withRevision": 0,
    "dateRange": {
      "oldest": "2025-01-28T00:01:00.000Z",
      "newest": "2025-10-28T00:01:00.000Z"
    },
    "publications": [
      {
        "id": "6914c891920dbcadc988c1d5",
        "indicatorId": "6914be303fd4ff95cff5e8a7",
        "forexFactoryEventId": "143551",
        "ts": "2025-10-28T00:01:00.000Z",
        "actual": 1,
        "forecast": 1.6,
        "previous": null,
        "revision": null,
        "isActive": false,
        "isMostRecent": true,
        "createdAt": "2025-11-12T17:49:05.242Z",
        "updatedAt": "2025-11-12T17:49:05.242Z"
      }
    ]
  }
}
```

**Statistics Fields:**
- `total` - Общее количество публикаций
- `withActual` - Количество с фактическими значениями
- `withForecast` - Количество с прогнозами
- `withRevision` - Количество с ревизиями
- `dateRange.oldest` - Самая старая публикация
- `dateRange.newest` - Самая новая публикация
- `publications` - Массив публикаций (отсортирован по дате, от новых к старым)

---

### 4. Create Indicator
Создать новый индикатор.

**Endpoint:** `POST /indicators`

**Request Body:**
```json
{
  "name": "New Economic Indicator",
  "country": "US",
  "impact": "high",
  "frequency": "monthly",
  "publishingTime": "certain",
  "affectedCurrencies": ["USD"],
  "affectedPairs": ["EURUSD", "GBPUSD"],
  "title": "New Economic Indicator",
  "info": [],
  "forexFactoryId": "12345"
}
```

---

### 5. Bulk Import Indicators
Массовый импорт индикаторов (пропускает существующие).

**Endpoint:** `POST /indicators/import`

**Request Body:**
```json
{
  "indicators": [...]
}
```

---

## Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "error": "Indicator not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Database Statistics

### Current Data
- **Indicators:** 272 (EUR: 86, USD: 87, GBP: 57, JPY: 41)
- **Publications:** 53,216 (исторические данные)
- **Date Range:** От самых ранних до октября 2025

### Data Structure

**Indicator Fields:**
- `id` - MongoDB ObjectId
- `name` - Название индикатора
- `country` - Код страны (2 символа)
- `impact` - Уровень влияния (low/medium/high)
- `frequency` - Частота публикации (annual/quarterly/monthly/weekly/daily)
- `publishingTime` - Определенность времени (certain/uncertain)
- `affectedCurrencies` - Массив затронутых валют
- `affectedPairs` - Массив затронутых валютных пар
- `title` - Полное название
- `info` - Массив спецификаций (IndicatorSpec[])
- `forexFactoryId` - ID в Forex Factory

**Publication Fields:**
- `id` - MongoDB ObjectId
- `indicatorId` - Ссылка на индикатор
- `forexFactoryEventId` - ID события в Forex Factory
- `ts` - Временная метка публикации
- `actual` - Фактическое значение
- `forecast` - Прогнозное значение
- `previous` - Предыдущее значение
- `revision` - Ревизия
- `isActive` - Активна ли публикация
- `isMostRecent` - Самая последняя публикация
