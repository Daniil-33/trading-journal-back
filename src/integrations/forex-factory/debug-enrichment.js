/**
 * Debug script to test single indicator enrichment
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function testSingleIndicator() {
  const TEST_EVENT_ID = 135840 // id field, not ebaseId
  const TEST_EBASE_ID = 116
  
  console.log(`🔍 Testing enrichment for event ID: ${TEST_EVENT_ID} (ebaseId: ${TEST_EBASE_ID})\n`)

  const browser = await puppeteer.launch({
    headless: false,
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

    console.log('⏳ Waiting for page to fully load...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Test fetching specs
    console.log('📋 Fetching specs...')
    const specsResponse = await page.evaluate(async (eventId) => {
      try {
        const response = await fetch(`https://www.forexfactory.com/calendar/details/1-${eventId}`, {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'x-requested-with': 'XMLHttpRequest'
          }
        })
        const data = await response.json()
        console.log('Specs response:', JSON.stringify(data, null, 2))
        return data
      } catch (error) {
        console.error('Error fetching specs:', error)
        return { error: error.message }
      }
    }, TEST_EVENT_ID)

    console.log('\n✅ Specs response:')
    console.log(JSON.stringify(specsResponse, null, 2))
    console.log('\n')

    // Test fetching historical data  
    console.log('📈 Fetching historical data...')
    const historyResponse = await page.evaluate(async (eventId) => {
      try {
        const response = await fetch(`https://www.forexfactory.com/calendar/graph/${eventId}?limit=10&site_id=1`, {
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
        console.log('History response:', JSON.stringify(data, null, 2))
        return data
      } catch (error) {
        console.error('Error fetching history:', error)
        return { error: error.message }
      }
    }, TEST_EVENT_ID)

    console.log('\n✅ History response:')
    console.log(JSON.stringify(historyResponse, null, 2))

    console.log('\n\n📊 Summary:')
    console.log(`Specs found: ${specsResponse.specs?.length || 0}`)
    console.log(`Publications found: ${historyResponse.data?.events?.length || 0}`)

    // Keep browser open for inspection
    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...')
    await new Promise(resolve => setTimeout(resolve, 30000))

  } finally {
    await browser.close()
  }
}

testSingleIndicator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
