// npm i puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

/**
 * Fetch indicator specs from Forex Factory
 * @param {*} page - Puppeteer page instance
 * @param {string} eventId - Event ID for the indicator (NOT ebaseId!)
 * @returns {Promise<Array>} specs array
 */
async function fetchIndicatorSpecs(page, eventId) {
  try {
    const response = await page.evaluate(async (id) => {
      const resp = await fetch(`https://www.forexfactory.com/calendar/details/1-${id}`, {
        headers: {
          "accept": "application/json, text/plain, */*",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        method: "GET",
        mode: "cors",
        credentials: "include"
      });
      
      const data = await resp.json();
      return data.data?.specs || [];
    }, eventId);

    return response;
  } catch (error) {
    console.error(`Error fetching specs for event ${eventId}:`, error.message);
    return [];
  }
}

/**
 * Fetch historical publications for an indicator from separate endpoint
 * @param {*} page - Puppeteer page instance  
 * @param {string} eventId - Event ID for the indicator
 * @param {number} limit - Max number of historical records (default 400)
 * @returns {Promise<Array>} publications array
 */
async function fetchHistoricalData(page, eventId, limit = 400) {
  try {
    const response = await page.evaluate(async (id, lim) => {
      const resp = await fetch(`https://www.forexfactory.com/calendar/graph/${id}?limit=${lim}&site_id=1`, {
        headers: {
          "accept": "application/json, text/plain, */*",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        method: "GET",
        mode: "cors",
        credentials: "include"
      });
      
      const data = await resp.json();
      return data.data?.events || [];
    }, eventId, limit);

    return response;
  } catch (error) {
    console.error(`Error fetching historical data for event ${eventId}:`, error.message);
    return [];
  }
}

/**
 * Main enrichment script
 */
(async () => {
  console.log('🚀 Starting Forex Factory data enrichment...\n');
  
  // Read the unique indicators file
  const uniqueIndicatorsPath = path.join(__dirname, 'unique-indicators.json');
  if (!fs.existsSync(uniqueIndicatorsPath)) {
    console.error('❌ unique-indicators.json not found!');
    console.log('Please run fetch-yearly-data.js first.');
    process.exit(1);
  }

  const uniqueIndicatorsData = JSON.parse(fs.readFileSync(uniqueIndicatorsPath, 'utf-8'));
  const indicators = uniqueIndicatorsData.indicators || [];

  console.log(`📊 Found ${indicators.length} indicators to enrich\n`);

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
  
  console.log('⏳ Waiting for page initialization...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  const enrichedIndicators = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < indicators.length; i++) {
    const indicator = indicators[i];
    const progress = `[${i + 1}/${indicators.length}]`;
    
    console.log(`${progress} Processing: ${indicator.name} (ebaseId: ${indicator.ebaseId})`);

    try {
      // Use the indicator's ID (not ebaseId) to fetch details
      const eventId = indicator.id;
      
      // Fetch specs (detailed information)
      console.log(`   📋 Fetching specs...`);
      const specs = await fetchIndicatorSpecs(page, eventId);
      
      // Fetch historical publications
      console.log(`   📈 Fetching historical data...`);
      const publications = await fetchHistoricalData(page, eventId);
      
      // Add enriched data to indicator
      enrichedIndicators.push({
        ...indicator,
        specs: specs,
        publications: publications,
        enrichedAt: new Date().toISOString()
      });

      console.log(`   ✅ Success: ${specs.length} specs, ${publications.length} publications\n`);
      successCount++;

      // Small delay to avoid rate limiting
      if (i < indicators.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
      
      // Add indicator without enrichment
      enrichedIndicators.push({
        ...indicator,
        specs: [],
        publications: [],
        enrichedAt: new Date().toISOString(),
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Enrichment Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully enriched: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  // Save enriched data
  const outputPath = path.join(__dirname, 'enriched-indicators.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    enrichedAt: new Date().toISOString(),
    totalIndicators: enrichedIndicators.length,
    successCount,
    errorCount,
    indicators: enrichedIndicators
  }, null, 2), 'utf-8');

  console.log(`💾 Enriched data saved to: ${outputPath}\n`);

  await browser.close();
  
  console.log('✅ Enrichment completed successfully!');
})();
