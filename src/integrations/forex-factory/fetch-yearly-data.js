// npm i puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

// Currency IDs from Forex Factory
// EUR: 15, USD: 12, GBP: 9, JPY: 14
const TARGET_CURRENCIES = [5, 6, 7, 9];
const CURRENCY_NAMES = {
  5: 'EUR',
  6: 'GBP',
  9: 'USD',
  7: 'JPY'
};

// Generate date ranges for the last 12 months (Oct 2024 - Oct 2025)
function generateMonthRanges() {
  const ranges = [];
  const startDate = new Date('2024-10-01');
  const endDate = new Date('2025-10-31');
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const beginDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    
    ranges.push({
      begin: formatDate(beginDate),
      end: formatDate(endDate),
      label: `${beginDate.toLocaleString('default', { month: 'long' })} ${year}`
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return ranges;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

(async () => {
  console.log('🚀 Starting Forex Factory data collection...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('📡 Navigating to Forex Factory...');
  await page.goto('https://www.forexfactory.com/calendar', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  // Wait for Cloudflare check
  console.log('⏳ Waiting for page initialization...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const client = await page.target().createCDPSession();

  // Load the fetch script
  const scriptPath = path.join(__dirname, 'fetch-calendar.js');
  const browserScript = fs.readFileSync(scriptPath, 'utf-8');

  const monthRanges = generateMonthRanges();
  const allEvents = [];
  const seenEventIds = new Set();

  console.log(`📅 Fetching data for ${monthRanges.length} months...\n`);

  for (let i = 0; i < monthRanges.length; i++) {
    const range = monthRanges[i];
    console.log(`📊 [${i + 1}/${monthRanges.length}] Fetching ${range.label}...`);
    
    try {
      // Create function call with parameters
      const functionCall = `(${browserScript})('${range.begin}', '${range.end}', [${TARGET_CURRENCIES.join(',')}])`;
      
      const resp = await client.send('Runtime.evaluate', {
        expression: functionCall,
        awaitPromise: true,
        returnByValue: true,
      });

      const result = resp.result.value;
      
      if (result.error) {
        console.error(`   ❌ Error: ${result.error}`);
        continue;
      }

      const events = result.Events || [];
      console.log(`   ✅ Retrieved ${events.length} events`);
      
      // Add unique events
      let newEvents = 0;
      events.forEach(event => {
        if (!seenEventIds.has(event.ebaseId)) {
          seenEventIds.add(event.ebaseId);
          allEvents.push(event);
          newEvents++;
        }
      });
      
      console.log(`   📝 Added ${newEvents} unique events\n`);
      
      // Small delay between requests to avoid rate limiting
      if (i < monthRanges.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to fetch ${range.label}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Data collection complete!`);
  console.log(`📊 Total unique events collected: ${allEvents.length}`);
  console.log('='.repeat(60) + '\n');

  // Save raw data
  const outputPath = path.join(__dirname, 'forex-calendar-yearly.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    collectedAt: new Date().toISOString(),
    dateRange: {
      from: '2024-10-01',
      to: '2025-10-31'
    },
    currencies: Object.values(CURRENCY_NAMES),
    totalEvents: allEvents.length,
    events: allEvents
  }, null, 2), 'utf-8');
  
  console.log(`💾 Raw data saved to: ${outputPath}\n`);

  // Get unique indicators (by ebaseId)
  const uniqueIndicators = new Map();
  
  allEvents.forEach(event => {
    if (!uniqueIndicators.has(event.ebaseId)) {
      uniqueIndicators.set(event.ebaseId, event);
    }
  });

  console.log(`🔍 Found ${uniqueIndicators.size} unique indicators\n`);

  // Save unique indicators list
  const indicatorsPath = path.join(__dirname, 'unique-indicators.json');
  fs.writeFileSync(indicatorsPath, JSON.stringify({
    totalIndicators: uniqueIndicators.size,
    indicators: Array.from(uniqueIndicators.values())
  }, null, 2), 'utf-8');
  
  console.log(`💾 Unique indicators saved to: ${indicatorsPath}\n`);

  await browser.close();
  
  console.log('✅ Process completed successfully!');
})();
