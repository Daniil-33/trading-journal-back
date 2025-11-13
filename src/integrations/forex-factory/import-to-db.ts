/**
 * Transform and Import Script
 * Transforms Forex Factory data to Indicator entities and imports to database
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { connectDatabase } from '../../infrastructure/database/connection'
import { ImportIndicators } from '../../application/use-cases/ImportIndicators'
import { MongoIndicatorRepository } from '../../infrastructure/repositories/MongoIndicatorRepository'
import { IIndicator } from '../../domain/entities/Indicator'
import { Currency, getCurrencyByCountry } from '../../shared/constants/currencies'
import { getAffectedPairs } from '../../shared/constants/currency-pairs'

// Impact mapping from Forex Factory
const IMPACT_MAP: Record<string, 'low' | 'medium' | 'high'> = {
  'holiday': 'low',
  'low': 'low',
  'medium': 'medium',
  'high': 'high'
}

// Frequency detection based on event name patterns
function detectFrequency(name: string): 'annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | null {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('annual') || lowerName.includes('yearly') || lowerName.includes('y/y') || lowerName.includes('yoy')) return 'annual'
  if (lowerName.includes('quarter') || lowerName.includes('q1') || lowerName.includes('q2') || 
      lowerName.includes('q3') || lowerName.includes('q4') || lowerName.includes('q/q') || lowerName.includes('qoq')) return 'quarterly'
  if (lowerName.includes('monthly') || lowerName.includes('month') || lowerName.includes('m/m') || lowerName.includes('mom')) return 'monthly'
  if (lowerName.includes('weekly') || lowerName.includes('week') || lowerName.includes('w/w')) return 'weekly'
  if (lowerName.includes('daily') || lowerName.includes('day') || lowerName.includes('d/d')) return 'daily'

  return 'monthly' // Default for most economic indicators
}

// Publishing time detection
function detectPublishingTime(timeMasked: boolean): 'certain' | 'uncertain' {
  return timeMasked ? 'uncertain' : 'certain'
}

// Map currency code to array of affected currencies
function getAffectedCurrencies(currencyCode: string, country: string): string[] {
  const currencies = [currencyCode]
  
  // Try to get currency from country code using shared constants
  if (country && country !== currencyCode) {
    const countryCurrency = getCurrencyByCountry(country)
    if (countryCurrency && !currencies.includes(countryCurrency)) {
      currencies.push(countryCurrency)
    }
  }
  
  return currencies
}

// Get affected currency pairs
function getAffectedCurrencyPairs(currencies: string[]): string[] {
  try {
    const currencyEnums = currencies
      .filter(c => Object.values(Currency).includes(c as Currency))
      .map(c => c as Currency)
    
    const pairs = getAffectedPairs(currencyEnums)
    return pairs.map(pair => pair.symbol)
  } catch (error) {
    console.error('Error getting affected pairs:', error)
    return []
  }
}

// Transform Forex Factory event to Indicator entity
function transformEvent(event: any): Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    // Skip events without ebaseId
    if (!event.ebaseId) {
      return null
    }

    // Map impact
    const impact = IMPACT_MAP[event.impactName] || 'low'
    
    // Detect frequency
    const frequency = detectFrequency(event.name)
    
    // Detect publishing time certainty
    const publishingTime = detectPublishingTime(event.timeMasked)
    
    // Get affected currencies
    const affectedCurrencies = getAffectedCurrencies(event.currency, event.country)
    
    // Get affected pairs
    const affectedPairs = getAffectedCurrencyPairs(affectedCurrencies)
    
    return {
      name: event.name,
      country: event.country,
      impact,
      frequency,
      publishingTime,
      affectedCurrencies,
      affectedPairs,
      title: event.soloTitle || event.prefixedName || event.name,
      info: [], // Empty for now, will be enriched later
      forexFactoryId: String(event.ebaseId)
    }
  } catch (error) {
    console.error(`Error transforming event ${event.ebaseId}:`, error)
    return null
  }
}

async function main() {
  console.log('🚀 Starting data transformation and import...\n')

  // Read the data file - use path relative to project root
  const projectRoot = path.join(__dirname, '../../..')
  const dataPath = path.join(projectRoot, 'src/integrations/forex-factory/unique-indicators.json')
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Data file not found:', dataPath)
    console.log('Please run fetch-yearly-data.js first to collect the data.')
    process.exit(1)
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const events = rawData.indicators || []
  
  console.log(`📊 Found ${events.length} unique indicators in data file\n`)

  // Transform events to indicators
  console.log('🔄 Transforming events to indicators...')
  const indicators: Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'>[] = []
  
  for (const event of events) {
    const indicator = transformEvent(event)
    if (indicator) {
      indicators.push(indicator)
    }
  }
  
  console.log(`✅ Transformed ${indicators.length} indicators\n`)

  // Connect to database
  console.log('🔌 Connecting to database...')
  await connectDatabase()
  console.log('✅ Connected to database\n')

  // Import to database
  console.log('💾 Importing indicators to database...')
  const indicatorRepository = new MongoIndicatorRepository()
  const importIndicators = new ImportIndicators(indicatorRepository)
  
  const result = await importIndicators.execute(indicators)
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Import Results:')
  console.log('='.repeat(60))
  console.log(`✅ Imported: ${result.imported}`)
  console.log(`⏭️  Skipped (already exist): ${result.skipped}`)
  console.log(`❌ Errors: ${result.errors}`)
  console.log('='.repeat(60))
  
  if (result.details.errorMessages.length > 0) {
    console.log('\n⚠️  Error details:')
    result.details.errorMessages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${msg}`)
    })
  }
  
  // Save import summary
  const summaryPath = path.join(__dirname, 'import-summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalProcessed: indicators.length,
    result
  }, null, 2), 'utf-8')
  
  console.log(`\n💾 Import summary saved to: ${summaryPath}`)
  console.log('\n✅ Process completed successfully!')
  
  process.exit(0)
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
