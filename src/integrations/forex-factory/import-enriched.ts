/**
 * Import Enriched Indicators with Specs and Publications
 * This script imports indicators with their detailed specs and historical publications
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { connectDatabase } from '../../infrastructure/database/connection'
import { ImportIndicators } from '../../application/use-cases/ImportIndicators'
import { ImportIndicatorPublications } from '../../application/use-cases/ImportIndicatorPublications'
import { MongoIndicatorRepository } from '../../infrastructure/repositories/MongoIndicatorRepository'
import { MongoIndicatorPublicationRepository } from '../../infrastructure/repositories/MongoIndicatorPublicationRepository'
import { IIndicator, IndicatorSpec } from '../../domain/entities/Indicator'
import { IIndicatorPublication } from '../../domain/entities/IndicatorPublicaton'
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
  
  if (lowerName.includes('annual') || lowerName.includes('yearly')) return 'annual'
  if (lowerName.includes('quarter') || lowerName.includes('q1') || lowerName.includes('q2') || 
      lowerName.includes('q3') || lowerName.includes('q4')) return 'quarterly'
  if (lowerName.includes('monthly') || lowerName.includes('month')) return 'monthly'
  if (lowerName.includes('weekly') || lowerName.includes('week')) return 'weekly'
  if (lowerName.includes('daily') || lowerName.includes('day')) return 'daily'
  
  return 'monthly' // Default for most economic indicators
}

// Publishing time detection
function detectPublishingTime(timeMasked: boolean): 'certain' | 'uncertain' {
  return timeMasked ? 'uncertain' : 'certain'
}

// Get affected currencies
function getAffectedCurrencies(currencyCode: string, country: string): string[] {
  const currencies = [currencyCode]
  
  const countryCurrency = getCurrencyByCountry(country)
  if (countryCurrency && !currencies.includes(countryCurrency)) {
    currencies.push(countryCurrency)
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
function transformToIndicator(event: any): Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    if (!event.ebaseId) return null

    const impact = IMPACT_MAP[event.impactName] || 'low'
    const frequency = detectFrequency(event.name)
    const publishingTime = detectPublishingTime(event.timeMasked)
    const affectedCurrencies = getAffectedCurrencies(event.currency, event.country)
    const affectedPairs = getAffectedCurrencyPairs(affectedCurrencies)
    
    // Transform specs to IndicatorSpec[]
    const specs: IndicatorSpec[] = (event.specs || []).map((spec: any) => ({
      order: spec.order || 0,
      title: spec.title || '',
      html: spec.html || ''
    }))
    
    return {
      name: event.name,
      country: event.country,
      impact,
      frequency,
      publishingTime,
      affectedCurrencies,
      affectedPairs,
      title: event.soloTitle || event.prefixedName || event.name,
      info: specs,
      forexFactoryId: String(event.ebaseId)
    }
  } catch (error) {
    console.error(`Error transforming event ${event.ebaseId}:`, error)
    return null
  }
}

// Transform Forex Factory publication to IndicatorPublication entity
function transformToPublication(
  pub: any, 
  indicatorId: string
): Omit<IIndicatorPublication, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    if (!pub.id || !pub.dateline) return null

    return {
      indicatorId,
      forexFactoryEventId: String(pub.id),
      ts: new Date(pub.dateline * 1000), // Unix timestamp to Date
      actual: pub.actual,
      forecast: pub.forecast,
      previous: pub.previous || null,
      revision: pub.revision,
      isActive: pub.is_active || false,
      isMostRecent: pub.is_most_recent || false
    }
  } catch (error) {
    console.error(`Error transforming publication ${pub.id}:`, error)
    return null
  }
}

async function main() {
  console.log('🚀 Starting enriched data import...\n')

  // Read enriched indicators file - use path relative to project root
  const projectRoot = path.join(__dirname, '../../..')
  const dataPath = path.join(projectRoot, 'src/integrations/forex-factory/enriched-indicators.json')
  
  if (!fs.existsSync(dataPath)) {
    console.error('❌ enriched-indicators.json not found!')
    console.log('Please run enrich-indicators.js first.')
    process.exit(1)
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const enrichedIndicators = rawData.indicators || []
  
  console.log(`📊 Found ${enrichedIndicators.length} enriched indicators\n`)

  // Transform indicators
  console.log('🔄 Transforming indicators...')
  const indicators: Omit<IIndicator, 'id' | 'createdAt' | 'updatedAt'>[] = []
  const indicatorPublicationsMap = new Map<string, any[]>() // forexFactoryId -> publications
  
  for (const enriched of enrichedIndicators) {
    const indicator = transformToIndicator(enriched)
    if (indicator) {
      indicators.push(indicator)
      // Store publications for later, keyed by forexFactoryId
      indicatorPublicationsMap.set(indicator.forexFactoryId!, enriched.publications || [])
    }
  }
  
  console.log(`✅ Transformed ${indicators.length} indicators\n`)

  // Connect to database
  console.log('🔌 Connecting to database...')
  await connectDatabase()
  console.log('✅ Connected to database\n')

  // Import indicators
  console.log('💾 Importing indicators...')
  const indicatorRepository = new MongoIndicatorRepository()
  const importIndicators = new ImportIndicators(indicatorRepository)
  
  const indicatorResult = await importIndicators.execute(indicators)
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Indicator Import Results:')
  console.log('='.repeat(60))
  console.log(`✅ Imported: ${indicatorResult.imported}`)
  console.log(`⏭️  Skipped: ${indicatorResult.skipped}`)
  console.log(`❌ Errors: ${indicatorResult.errors}`)
  console.log('='.repeat(60) + '\n')

  // Now import publications
  // First, we need to get indicator IDs from database
  console.log('🔍 Fetching indicator IDs from database...')
  const allIndicators = await indicatorRepository.findAll()
  const forexFactoryIdToIndicatorId = new Map<string, string>()
  
  allIndicators.forEach(ind => {
    if (ind.forexFactoryId && ind.id) {
      forexFactoryIdToIndicatorId.set(ind.forexFactoryId, ind.id)
    }
  })
  
  console.log(`✅ Mapped ${forexFactoryIdToIndicatorId.size} indicators\n`)

  // Transform publications
  console.log('🔄 Transforming publications...')
  const publications: Omit<IIndicatorPublication, 'id' | 'createdAt' | 'updatedAt'>[] = []
  
  for (const [forexFactoryId, pubs] of indicatorPublicationsMap.entries()) {
    const indicatorId = forexFactoryIdToIndicatorId.get(forexFactoryId)
    if (!indicatorId) {
      console.warn(`⚠️  No indicator ID found for forexFactoryId: ${forexFactoryId}`)
      continue
    }

    for (const pub of pubs) {
      const publication = transformToPublication(pub, indicatorId)
      if (publication) {
        publications.push(publication)
      }
    }
  }
  
  console.log(`✅ Transformed ${publications.length} publications\n`)

  // Import publications in batches
  let publicationImportResult: { imported: number; skipped: number; errors: number } | null = null
  
  if (publications.length > 0) {
    console.log('💾 Importing publications in batches...')
    const publicationRepository = new MongoIndicatorPublicationRepository()
    const importPublications = new ImportIndicatorPublications(publicationRepository)
    
    const BATCH_SIZE = 1000 // Import 1000 publications at a time
    const totalBatches = Math.ceil(publications.length / BATCH_SIZE)
    
    let totalImported = 0
    let totalSkipped = 0
    let totalErrors = 0
    
    console.log(`📦 Total publications: ${publications.length}`)
    console.log(`📦 Batch size: ${BATCH_SIZE}`)
    console.log(`📦 Total batches: ${totalBatches}\n`)
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, publications.length)
      const batch = publications.slice(start, end)
      
      console.log(`[${i + 1}/${totalBatches}] Importing batch: ${start + 1}-${end} (${batch.length} publications)`)
      
      try {
        const result = await importPublications.execute(batch)
        totalImported += result.imported
        totalSkipped += result.skipped
        totalErrors += result.errors
        
        console.log(`   ✅ Batch completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors} errors`)
      } catch (error: any) {
        console.error(`   ❌ Batch failed:`, error.message)
        totalErrors += batch.length
      }
      
      // Small delay between batches to avoid overloading DB
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Publication Import Results:')
    console.log('='.repeat(60))
    console.log(`✅ Imported: ${totalImported}`)
    console.log(`⏭️  Skipped: ${totalSkipped}`)
    console.log(`❌ Errors: ${totalErrors}`)
    console.log('='.repeat(60))
    
    // Store results for summary
    publicationImportResult = { imported: totalImported, skipped: totalSkipped, errors: totalErrors }
  } else {
    console.log('⚠️  No publications to import')
  }

  // Save summary
  const summaryPath = path.join(projectRoot, 'src/integrations/forex-factory/import-summary-enriched.json')
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    indicators: indicatorResult,
    publications: publicationImportResult
  }, null, 2), 'utf-8')
  
  console.log(`\n💾 Import summary saved to: ${summaryPath}`)
  console.log('\n✅ Process completed successfully!')
  
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
