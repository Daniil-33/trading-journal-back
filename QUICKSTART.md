# Quick Start Guide - Forex Factory Data Import

## Prerequisites ✅

1. **MongoDB Running**
   ```bash
   # Check if MongoDB is running
   mongosh
   ```

2. **Environment Variables**
   Create a `.env` file with:
   ```env
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_DATABASE=macro-analytics
   JWT_SECRET=your-secret-key
   ```

3. **Dependencies Installed**
   ```bash
   npm install
   ```

## Step-by-Step Instructions 🚀

### 1. Fetch Forex Factory Data (10-15 minutes)

```bash
npm run fetch-forex-data
```

**What happens:**
- Browser window will open (don't close it!)
- Script fetches 12 months of data (Oct 2024 - Oct 2025)
- Target currencies: EUR, USD, GBP, JPY
- Progress displayed in terminal with emojis
- Creates two files:
  - `src/integrations/forex-factory/forex-calendar-yearly.json`
  - `src/integrations/forex-factory/unique-indicators.json`

**Expected Output:**
```
🚀 Starting Forex Factory data collection...
📊 [1/12] Fetching October 2024...
   ✅ Retrieved 234 events
   📝 Added 123 unique events
...
📊 Total unique events collected: 1450
🔍 Found 287 unique indicators
✅ Process completed successfully!
```

### 2. Import to Database (< 1 minute)

```bash
npm run import-indicators
```

**What happens:**
- Reads `unique-indicators.json`
- Transforms Forex Factory events to Indicator entities
- Connects to MongoDB
- Imports only new indicators (skips existing)
- Creates `src/integrations/forex-factory/import-summary.json`

**Expected Output:**
```
🚀 Starting data transformation and import...
📊 Found 287 unique indicators in data file
🔄 Transforming events to indicators...
✅ Transformed 287 indicators
🔌 Connecting to database...
✅ Connected to database
💾 Importing indicators to database...

============================================================
📊 Import Results:
============================================================
✅ Imported: 287
⏭️  Skipped (already exist): 0
❌ Errors: 0
============================================================
```

### 3. Test the API

Start the server:
```bash
npm run dev
```

Test endpoints:

**Get all indicators:**
```bash
curl http://localhost:5000/api/indicators
```

**Filter by impact:**
```bash
curl "http://localhost:5000/api/indicators?impact=high"
```

**Filter by currencies:**
```bash
curl "http://localhost:5000/api/indicators?currencies=USD,EUR"
```

**Filter by country:**
```bash
curl "http://localhost:5000/api/indicators?country=US"
```

**Combined filters:**
```bash
curl "http://localhost:5000/api/indicators?country=US&impact=high&currencies=USD"
```

## Common Issues & Solutions 🔧

### Issue: Browser closes immediately
**Solution:** The script uses `headless: false`. If Cloudflare appears, wait for the check to complete.

### Issue: "Cannot connect to MongoDB"
**Solution:** 
```bash
# Start MongoDB
brew services start mongodb-community
# or
mongod --dbpath /path/to/data
```

### Issue: "unique-indicators.json not found"
**Solution:** Run Step 1 first: `npm run fetch-forex-data`

### Issue: Import shows "0 imported, all skipped"
**Solution:** Data already exists. This is normal on subsequent runs.

## Re-running to Update Data 🔄

To refresh with latest data:

1. **Fetch fresh data:**
   ```bash
   npm run fetch-forex-data
   ```

2. **Import new indicators:**
   ```bash
   npm run import-indicators
   ```

The system will only import new indicators that don't exist yet.

## Verifying Import in MongoDB 📊

```bash
mongosh

use macro-analytics

# Count indicators
db.indicators.countDocuments()

# View sample indicators
db.indicators.find().limit(5).pretty()

# Check by country
db.indicators.find({country: "US"}).count()

# Check by impact
db.indicators.find({impact: "high"}).count()

# Check specific currencies
db.indicators.find({affectedCurrencies: "USD"}).count()
```

## Files Generated 📁

After running the scripts, you'll have:

```
src/integrations/forex-factory/
├── forex-calendar-yearly.json    # All events (large file ~5-10MB)
├── unique-indicators.json        # Unique indicators by ebaseId
└── import-summary.json           # Import statistics
```

These files are safe to delete after successful import to MongoDB.

## Next Steps 💡

1. **Explore the API** - Try different filters and queries
2. **Integrate with frontend** - Use the indicators in your trading journal
3. **Schedule updates** - Set up a cron job to fetch new data monthly
4. **Add publications** - Track actual indicator releases using IndicatorPublication entity

## Performance Tips ⚡

- **First import**: ~287 indicators, takes < 10 seconds
- **Subsequent imports**: All skipped (already exist), takes < 2 seconds
- **Queries**: Indexed fields (country, impact, currencies) are fast
- **Filter recommendations**: Use currencies filter for best performance

## Need Help? 🆘

Check these files for more information:
- `src/integrations/forex-factory/README.md` - Detailed documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical overview
- `import-summary.json` - Last import results with error details

---

**You're all set!** 🎉 The Indicator system is ready to use.
