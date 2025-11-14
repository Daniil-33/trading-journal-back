# Candles Import Folder

Place your CSV files here for importing historical candle data.

## File Naming Convention

Files must be named according to the pattern: `{PAIR}_{TIMEFRAME}.csv`

### Examples:
- `EURUSD_5m.csv` - EUR/USD 5-minute candles
- `EURUSD_15m.csv` - EUR/USD 15-minute candles
- `EURUSD_1h.csv` - EUR/USD 1-hour candles
- `GBPUSD_1d.csv` - GBP/USD daily candles
- `USDJPY_1w.csv` - USD/JPY weekly candles

### Supported Pairs:
- `EURUSD`
- `GBPUSD`
- `USDJPY`
- `EURJPY`

### Supported Timeframes:
- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `4h` - 4 hours
- `1d` - 1 day
- `1w` - 1 week

## CSV Format

Each CSV file must have the following format:

```
Gmt time,Open,High,Low,Close,Volume
2005.01.03 00:00,1.3556,1.3576,1.3555,1.3569,53
2005.01.03 01:00,1.3569,1.3572,1.3551,1.3560,43
2005.01.03 02:00,1.3560,1.3569,1.3544,1.3554,63
```

### Field Description:
- **Gmt time** - Timestamp in GMT/UTC (format: `YYYY.MM.DD HH:MM`)
- **Open** - Opening price
- **High** - Highest price
- **Low** - Lowest price
- **Close** - Closing price
- **Volume** - Trading volume

## How to Import

1. Place your CSV files in this folder
2. Run the import script:
   ```bash
   npm run build
   node dist/integrations/candles/import-candles.js
   ```

## Import Features

- ✅ **Batch Processing** - Imports 10,000 candles at a time for optimal performance
- ✅ **Duplicate Detection** - Automatically skips duplicate candles (same pair/timeframe/timestamp)
- ✅ **Validation** - Validates OHLC relationships and data integrity
- ✅ **Progress Tracking** - Shows detailed progress and statistics
- ✅ **Error Handling** - Continues import even if some records fail

## Import Statistics

After import completes, you'll see:
- Total candles inserted
- Duplicates skipped
- Errors encountered
- Date range of imported data
- Total candles per pair/timeframe

## Example Import Output

```
🚀 Candle Data Import Script Started
================================================================================
📡 Connecting to MongoDB...
✅ MongoDB connected

📁 Found 2 CSV file(s) to import:

   • EURUSD_1h.csv (EURUSD - 1h)
   • GBPUSD_1d.csv (GBPUSD - 1d)

[1/2] Processing EURUSD_1h.csv...
--------------------------------------------------------------------------------
📄 File size: 45.23 MB
📝 Total lines: 175,320
⚙️  Parsing CSV...
✅ Parsed 175,319 candles in 2.45s
💾 Importing to MongoDB (batch size: 10,000)...
✅ Import completed in 15.32s
✅ Completed: EURUSD_1h.csv
   Inserted: 175,319
   Duplicates: 0
   Errors: 0
   Total in DB: 175,319
   Date range: 2005-01-03T00:00:00.000Z to 2024-12-31T23:00:00.000Z

================================================================================
🎉 IMPORT COMPLETED
================================================================================
📊 Total Files Processed: 2
✅ Total Candles Inserted: 350,000
⚠️  Total Duplicates Skipped: 0
❌ Total Errors: 0

📈 Database Summary:
--------------------------------------------------------------------------------
EURUSD 1h: 175,319 candles
GBPUSD 1d: 174,681 candles
```

## Notes

- First line of CSV can be a header (will be automatically skipped)
- Empty lines are ignored
- The import script is idempotent - you can run it multiple times safely
- Duplicates are detected by unique constraint on (pair + timeframe + timestamp)
