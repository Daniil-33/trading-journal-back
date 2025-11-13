/**
 * Update Existing Indicators with Specs (info field)
 * This script updates indicators in database with enriched specs data
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { connectDatabase } from '../../infrastructure/database/connection'
import { IndicatorModel } from '../../infrastructure/database/models/IndicatorModel'
import { IndicatorSpec } from '../../domain/entities/Indicator'

// Transform Forex Factory specs to IndicatorSpec format
function transformSpecs(specs: any[]): IndicatorSpec[] {
  if (!Array.isArray(specs)) return []
  
  return specs.map(spec => ({
    order: spec.order || 0,
    title: spec.title || '',
    html: spec.html || ''
  }))
}

async function main() {
  console.log('🚀 Starting indicators specs update...\n')

  // Read enriched indicators file
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

  // Connect to database
  console.log('🔌 Connecting to database...')
  await connectDatabase()
  console.log('✅ Connected to database\n')

  // Update indicators with specs
  console.log('🔄 Updating indicators with specs...\n')
  
  let updated = 0
  let skipped = 0
  let errors = 0
  
  for (const enriched of enrichedIndicators) {
    try {
      const forexFactoryId = String(enriched.ebaseId)
      const specs = transformSpecs(enriched.specs || [])
      
      // Find indicator by forexFactoryId
      const indicator = await IndicatorModel.findOne({ forexFactoryId })
      
      if (!indicator) {
        console.warn(`⚠️  Indicator not found: ${enriched.name} (forexFactoryId: ${forexFactoryId})`)
        skipped++
        continue
      }
      
      // Check if already has specs
      if (indicator.info && indicator.info.length > 0) {
        console.log(`⏭️  Skipping ${enriched.name} - already has ${indicator.info.length} specs`)
        skipped++
        continue
      }
      
      // Update with specs
      indicator.info = specs
      await indicator.save()
      
      console.log(`✅ Updated ${enriched.name} - added ${specs.length} specs`)
      updated++
      
    } catch (error: any) {
      console.error(`❌ Error updating ${enriched.name}:`, error.message)
      errors++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Update Results:')
  console.log('='.repeat(60))
  console.log(`✅ Updated: ${updated}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors}`)
  console.log('='.repeat(60))
  
  // Verify update
  console.log('\n🔍 Verifying update...')
  const totalIndicators = await IndicatorModel.countDocuments({})
  const withSpecs = await IndicatorModel.countDocuments({ 'info.0': { $exists: true } })
  const withoutSpecs = await IndicatorModel.countDocuments({ 
    $or: [
      { info: { $exists: false } },
      { info: { $size: 0 } }
    ]
  })
  
  console.log(`Total indicators: ${totalIndicators}`)
  console.log(`With specs: ${withSpecs}`)
  console.log(`Without specs: ${withoutSpecs}`)
  
  console.log('\n✅ Process completed successfully!')
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
