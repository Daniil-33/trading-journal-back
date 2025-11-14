# 📊 Candle API Documentation

## Base URL
```
http://localhost:3001/api/candles
```

## Endpoints

### 1. Get Statistics

Get overall statistics about available candle data.

**Endpoint:** `GET /api/candles/statistics`

**Response:**
```json
{
  "totalCandles": 309204,
  "pairs": 1,
  "datasets": 7,
  "data": {
    "EURUSD": [
      {
        "timeframe": "5m",
        "count": 192264,
        "oldest": "2023-12-31T22:00:00.000Z",
        "newest": "2025-12-10T21:55:00.000Z",
        "daysRange": 710
      }
    ]
  }
}
```

**Example:**
```bash
curl http://localhost:3001/api/candles/statistics
```

---

### 2. Get Available Pairs

Get list of all supported pairs and timeframes, plus which combinations have data.

**Endpoint:** `GET /api/candles/pairs`

**Response:**
```json
{
  "pairs": ["EURUSD", "GBPUSD", "USDJPY", "EURJPY"],
  "timeframes": ["5m", "15m", "30m", "1h", "4h", "1d", "1w"],
  "available": {
    "EURUSD": ["5m", "15m", "30m", "1h", "4h", "1d", "1w"]
  }
}
```

**Example:**
```bash
curl http://localhost:3001/api/candles/pairs
```

---

### 3. Get Candles

Get candles for a specific pair and timeframe with optional filters.

**Endpoint:** `GET /api/candles/:pair/:timeframe`

**Path Parameters:**
- `pair` (string, required): Currency pair (EURUSD, GBPUSD, USDJPY, EURJPY)
- `timeframe` (string, required): Timeframe (5m, 15m, 30m, 1h, 4h, 1d, 1w)

**Query Parameters:**
- `from` (ISO date string, optional): Start date
- `to` (ISO date string, optional): End date
- `limit` (number, optional): Max candles to return (1-10000, default: 1000)
- `skip` (number, optional): Number of candles to skip

**Response:**
```json
{
  "pair": "EURUSD",
  "timeframe": "1h",
  "count": 5,
  "candles": [
    {
      "id": "69160a6923bedc991c8fe6d6",
      "pair": "EURUSD",
      "timeframe": "1h",
      "timestamp": "2025-12-10T21:00:00.000Z",
      "ohlcv": [1.16032, 1.16101, 1.16001, 1.16015, 2617.8],
      "createdAt": "2025-11-13T16:42:17.299Z",
      "updatedAt": "2025-11-13T16:42:17.299Z"
    }
  ]
}
```

**OHLCV Array Structure:**
```
ohlcv[0] = Open
ohlcv[1] = High
ohlcv[2] = Low
ohlcv[3] = Close
ohlcv[4] = Volume
```

**Examples:**

Get daily candles for January 2025:
```bash
curl "http://localhost:3001/api/candles/EURUSD/1d?from=2025-01-01&to=2025-01-31"
```

Get 100 hourly candles:
```bash
curl "http://localhost:3001/api/candles/EURUSD/1h?limit=100"
```

Get 5-minute candles with pagination:
```bash
curl "http://localhost:3001/api/candles/EURUSD/5m?limit=1000&skip=0"
```

---

### 4. Get Latest Candles

Get the most recent N candles for a pair/timeframe.

**Endpoint:** `GET /api/candles/:pair/:timeframe/latest`

**Path Parameters:**
- `pair` (string, required): Currency pair
- `timeframe` (string, required): Timeframe

**Query Parameters:**
- `limit` (number, optional): Number of candles (1-10000, default: 100)

**Response:**
```json
{
  "pair": "EURUSD",
  "timeframe": "1h",
  "count": 5,
  "candles": [
    {
      "id": "69160a6923bedc991c8fe6d6",
      "pair": "EURUSD",
      "timeframe": "1h",
      "timestamp": "2025-12-10T21:00:00.000Z",
      "ohlcv": [1.16032, 1.16101, 1.16001, 1.16015, 2617.8],
      "createdAt": "2025-11-13T16:42:17.299Z",
      "updatedAt": "2025-11-13T16:42:17.299Z"
    }
  ]
}
```

**Examples:**

Get last 5 hourly candles:
```bash
curl "http://localhost:3001/api/candles/EURUSD/1h/latest?limit=5"
```

Get last 100 5-minute candles:
```bash
curl "http://localhost:3001/api/candles/EURUSD/5m/latest?limit=100"
```

---

### 5. Get Candle Count

Get total number of candles for a pair/timeframe.

**Endpoint:** `GET /api/candles/:pair/:timeframe/count`

**Path Parameters:**
- `pair` (string, required): Currency pair
- `timeframe` (string, required): Timeframe

**Response:**
```json
{
  "pair": "EURUSD",
  "timeframe": "5m",
  "count": 192264
}
```

**Example:**
```bash
curl "http://localhost:3001/api/candles/EURUSD/5m/count"
```

---

## Error Responses

### Invalid Currency Pair
```json
{
  "error": "Invalid currency pair",
  "validPairs": ["EURUSD", "GBPUSD", "USDJPY", "EURJPY"]
}
```

### Invalid Timeframe
```json
{
  "error": "Invalid timeframe",
  "validTimeframes": ["5m", "15m", "30m", "1h", "4h", "1d", "1w"]
}
```

### Invalid Date Format
```json
{
  "error": "Invalid \"from\" date format"
}
```

### Invalid Limit
```json
{
  "error": "Invalid limit (must be 1-10000)"
}
```

---

## Data Structure

### Candle Object

```typescript
{
  id: string              // MongoDB ObjectId
  pair: string            // Currency pair (EURUSD, etc.)
  timeframe: string       // Timeframe (5m, 1h, 1d, etc.)
  timestamp: string       // ISO 8601 date (candle open time in GMT)
  ohlcv: number[]         // [Open, High, Low, Close, Volume]
  createdAt: string       // ISO 8601 date
  updatedAt: string       // ISO 8601 date
}
```

### OHLCV Array

The `ohlcv` field is an array of 5 numbers representing:

| Index | Field  | Description                 |
|-------|--------|-----------------------------|
| 0     | Open   | Opening price               |
| 1     | High   | Highest price in period     |
| 2     | Low    | Lowest price in period      |
| 3     | Close  | Closing price               |
| 4     | Volume | Trading volume              |

**Benefits:**
- **Compact**: 1 field instead of 5
- **Efficient**: Less data transfer, smaller JSON
- **Fast**: Direct array access `ohlcv[0]` for Open

**Example Usage (JavaScript):**
```javascript
const candle = response.candles[0]
const [open, high, low, close, volume] = candle.ohlcv

console.log(`Open: ${open}`)
console.log(`High: ${high}`)
console.log(`Low: ${low}`)
console.log(`Close: ${close}`)
console.log(`Volume: ${volume}`)
```

---

## Testing Examples

### Test 1: Get Statistics
```bash
curl -s http://localhost:3001/api/candles/statistics | jq
```

### Test 2: Get Latest 10 Hourly Candles
```bash
curl -s "http://localhost:3001/api/candles/EURUSD/1h/latest?limit=10" | jq
```

### Test 3: Get Daily Candles for Date Range
```bash
curl -s "http://localhost:3001/api/candles/EURUSD/1d?from=2024-01-01&to=2024-12-31" | jq
```

### Test 4: Get Count
```bash
curl -s "http://localhost:3001/api/candles/EURUSD/5m/count" | jq
```

### Test 5: Extract OHLCV Data
```bash
curl -s "http://localhost:3001/api/candles/EURUSD/1h/latest?limit=1" | \
  jq '.candles[0] | {
    time: .timestamp,
    open: .ohlcv[0],
    high: .ohlcv[1],
    low: .ohlcv[2],
    close: .ohlcv[3],
    volume: .ohlcv[4]
  }'
```

---

## Performance Notes

- **Indexes**: Compound index on `{pair, timeframe, timestamp}` for fast queries
- **Limit**: Default 1000, max 10000 candles per request
- **Pagination**: Use `limit` and `skip` for large datasets
- **Date Range**: Use `from` and `to` filters for efficient queries
- **Latest**: Optimized query for most recent candles

---

## Current Data

Based on the test results:

**EURUSD** (2023-12-31 to 2025-12-10):
- `5m`: 192,264 candles
- `15m`: 64,088 candles
- `30m`: 32,044 candles
- `1h`: 16,022 candles
- `4h`: 4,020 candles
- `1d`: 670 candles
- `1w`: 96 candles

**Total**: 309,204 candles

---

## Next Steps

1. **More Pairs**: Import GBPUSD, USDJPY, EURJPY data
2. **WebSocket**: Real-time candle updates
3. **Indicators**: Calculate MA, RSI, MACD endpoints
4. **Aggregation**: Generate higher timeframes from lower ones
5. **Caching**: Redis for frequently accessed data

---

## 🎉 API is Ready!

All endpoints tested and working correctly! ✅
