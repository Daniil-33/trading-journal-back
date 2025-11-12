# Forex Factory Data Collection and Import

This module provides scripts for automatically downloading economic calendar data from Forex Factory for the last year and importing it into the database.

## Overview

The system consists of three main components:

1. **Data Collection Script** (`fetch-yearly-data.js`) - Fetches calendar data for 12 months
2. **Data Transformation and Import Script** (`import-to-db.ts`) - Transforms and imports data to MongoDB
3. **API Endpoints** - RESTful API for managing indicators

## Target Currencies

The scripts fetch data for the following currency pairs:
- **EUR** (Euro)
- **USD** (US Dollar)
- **GBP** (British Pound)
- **JPY** (Japanese Yen)

## Date Range

- **From:** October 2024
- **To:** October 2025
- **Total:** 12 months of historical data

## Prerequisites

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

## Usage

### Step 1: Fetch Data from Forex Factory

Run the data collection script to fetch calendar events for the last 12 months:

```bash
cd src/integrations/forex-factory
node fetch-yearly-data.js
```

This script will:
- Fetch data month by month (12 API requests)
- Collect all events for EUR, USD, GBP, JPY currencies
- Deduplicate events by `ebaseId` (Forex Factory ID)
- Save two files:
  - `forex-calendar-yearly.json` - All events with full details
  - `unique-indicators.json` - Unique indicators (deduplicated by ebaseId)

**Output:**
```
🚀 Starting Forex Factory data collection...
📊 Total unique events collected: XXXX
💾 Raw data saved to: forex-calendar-yearly.json
🔍 Found XXX unique indicators
💾 Unique indicators saved to: unique-indicators.json
✅ Process completed successfully!
```

### Step 2: Transform and Import to Database

Run the import script to transform the data and save it to MongoDB:

```bash
cd ../../..
npm run build  # Compile TypeScript
node dist/integrations/forex-factory/import-to-db.js
```

Or using ts-node:
```bash
npx ts-node src/integrations/forex-factory/import-to-db.ts
```

This script will:
- Read the `unique-indicators.json` file
- Transform Forex Factory events to Indicator entities
- Check for existing indicators by `forexFactoryId`
- Import only new indicators (skip duplicates)
- Save import summary to `import-summary.json`

**Output:**
```
🚀 Starting data transformation and import...
📊 Found XXX unique indicators in data file
🔄 Transforming events to indicators...
✅ Transformed XXX indicators
🔌 Connecting to database...
✅ Connected to database
💾 Importing indicators to database...

============================================================
📊 Import Results:
============================================================
✅ Imported: XXX
⏭️  Skipped (already exist): XXX
❌ Errors: 0
============================================================
```

## Data Transformation

The transformation process maps Forex Factory events to our Indicator entity:

| Forex Factory Field | Indicator Field | Transformation |
|---------------------|-----------------|----------------|
| `ebaseId` | `forexFactoryId` | String conversion |
| `name` | `name` | Direct mapping |
| `country` | `country` | Direct mapping |
| `impactName` | `impact` | Mapped to 'low', 'medium', 'high' |
| `name` (analyzed) | `frequency` | Detected from name patterns |
| `timeMasked` | `publishingTime` | 'certain' or 'uncertain' |
| `currency` | `affectedCurrencies` | Array of currency codes |
| `soloTitle` | `title` | Fallback chain |
| `notice` / `soloTitleFull` | `description` | Fallback chain |

### Impact Mapping

- `holiday` → `low`
- `low` → `low`
- `medium` → `medium`
- `high` → `high`

### Frequency Detection

The script analyzes the indicator name to detect frequency:
- Keywords: "annual", "yearly" → `annual`
- Keywords: "quarter", "Q1", "Q2", etc. → `quarterly`
- Keywords: "monthly", "month" → `monthly`
- Keywords: "weekly", "week" → `weekly`
- Keywords: "daily", "day" → `daily`
- Default → `monthly`

## API Endpoints

After importing, you can manage indicators through the API:

### Get All Indicators
```bash
GET /api/indicators
```

**Query Parameters:**
- `country` - Filter by country code (e.g., "US", "EU")
- `impact` - Filter by impact level ("low", "medium", "high")
- `currencies` - Filter by currencies (comma-separated, e.g., "USD,EUR")

**Example:**
```bash
curl http://localhost:5000/api/indicators?impact=high&currencies=USD,EUR
```

### Create Single Indicator
```bash
POST /api/indicators
Content-Type: application/json

{
  "name": "Non-Farm Payrolls",
  "country": "US",
  "impact": "high",
  "frequency": "monthly",
  "publishingTime": "certain",
  "affectedCurrencies": ["USD"],
  "title": "US Non-Farm Payrolls",
  "description": "Monthly employment report",
  "forexFactoryId": "123"
}
```

### Bulk Import Indicators
```bash
POST /api/indicators/import
Content-Type: application/json

{
  "indicators": [
    { ... },
    { ... }
  ]
}
```

## File Structure

```
src/integrations/forex-factory/
├── fetch-calendar.js           # Browser-side fetch script
├── fetch-yearly-data.js        # Node.js data collection script
├── import-to-db.ts            # Data transformation and import
├── index.js                   # Original MVP script
├── result-example.json        # Example API response
├── forex-calendar-yearly.json # Generated: Full year data
├── unique-indicators.json     # Generated: Unique indicators
├── import-summary.json        # Generated: Import results
└── README.md                  # This file
```

## Updating the Database

To update the database with new data:

1. Run `fetch-yearly-data.js` again to collect fresh data
2. Run `import-to-db.ts` to import new indicators

The import script will automatically skip indicators that already exist in the database (based on `forexFactoryId`), so you can safely run it multiple times.

## Troubleshooting

### Cloudflare Check Issues

If the script fails with Cloudflare protection:
- The browser will open in non-headless mode
- Wait for manual Cloudflare check completion if needed
- The script will continue automatically after verification

### Rate Limiting

The script includes a 2-second delay between monthly requests to avoid rate limiting. If you encounter issues:
- Increase the delay in `fetch-yearly-data.js` (line with `setTimeout`)
- Run the script during off-peak hours

### Database Connection

Ensure MongoDB is running and environment variables are set:
```bash
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=macro-analytics
```

Or use a full connection string:
```bash
MONGODB_URI=mongodb://localhost:27017/macro-analytics
```

## Notes

- The `ebaseId` field in Forex Factory data is the unique identifier for each indicator type
- Multiple events can have the same `ebaseId` (representing different publications of the same indicator)
- Our system stores only unique indicators, not individual publication events
- For publication events, use the IndicatorPublication entity (separate module)
