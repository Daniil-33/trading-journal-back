/**
 * Test Enrichment Script - Enrich only first 10 indicators for testing
 * Fetches specs and historical data from Forex Factory
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')
const path = require('path')

puppeteer.use(StealthPlugin())

// Test with first N indicators
const TEST_LIMIT = 10

async function enrichIndicators() {
  console.log('🚀 Starting Forex Factory data enrichment (TEST MODE - first 10 indicators)...\n')

  // Read unique indicators
  const inputPath = path.join(__dirname, 'unique-indicators.json')
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  const indicators = data.indicators.slice(0, TEST_LIMIT) // Only first 10 for testing
  
  console.log(`📊 Found ${data.indicators.length} indicators, testing with first ${indicators.length}\n`)

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // Navigate to Forex Factory
    console.log('📡 Navigating to Forex Factory...')
    await page.goto('https://www.forexfactory.com/calendar', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    console.log('⏳ Waiting for page initialization...\n')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Enrich each indicator
    for (let i = 0; i < indicators.length; i++) {
      const indicator = indicators[i]
      console.log(`[${i + 1}/${indicators.length}] Processing: ${indicator.name} (id: ${indicator.id}, ebaseId: ${indicator.ebaseId})`)

      try {
        // Fetch specs AND historical data in TWO separate calls
        console.log('   📋 Fetching specs...')
        const specs = await page.evaluate(async (eventId) => {
          const response = await fetch(`https://www.forexfactory.com/calendar/details/1-${eventId}`, {
            headers: {
              'accept': 'application/json, text/plain, */*',
              'x-requested-with': 'XMLHttpRequest'
            }
          })
          const data = await response.json()
          return data.data?.specs || []
        }, indicator.id) // Use id, not ebaseId!

        console.log('   📈 Fetching historical data...')
        const publications = await page.evaluate(async (eventId) => {
          const response = await fetch(`https://www.forexfactory.com/calendar/graph/${eventId}?limit=400&site_id=1`, {
            headers: {
              'accept': 'application/json, text/plain, */*',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'x-requested-with': 'XMLHttpRequest'
            },
            method: 'GET',
            mode: 'cors',
            credentials: 'include'
          })
          const data = await response.json()
          return data.data?.events || []
        }, indicator.id)

        // Store enriched data
        indicator.specs = specs
        indicator.publications = publications

        console.log(`   ✅ Success: ${specs.length} specs, ${publications.length} publications\n`)

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`   ❌ Error processing indicator ${indicator.id}:`, error.message)
        indicator.specs = []
        indicator.publications = []
      }
    }

    // Save enriched data
    const outputPath = path.join(__dirname, 'enriched-indicators-test.json')
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ indicators }, null, 2),
      'utf-8'
    )

    console.log('✅ Enrichment complete!')
    console.log(`💾 Enriched data saved to: ${outputPath}`)
    console.log(`\n📊 Summary:`)
    console.log(`   Total processed: ${indicators.length}`)
    console.log(`   With specs: ${indicators.filter(i => i.specs && i.specs.length > 0).length}`)
    console.log(`   With publications: ${indicators.filter(i => i.publications && i.publications.length > 0).length}`)

  } finally {
    await browser.close()
  }
}

// Run
enrichIndicators()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
