/**
 * Check final imported data - indicators with specs and publications
 */

import 'dotenv/config'
import { connectDatabase } from '../../infrastructure/database/connection'
import { IndicatorModel } from '../../infrastructure/database/models/IndicatorModel'
import { IndicatorPublicationModel } from '../../infrastructure/database/models/IndicatorPublicationModel'

async function checkFinalData() {
  try {
    console.log('🔌 Connecting to database...')
    await connectDatabase()
    console.log('✅ Connected\n')

    // Check indicators with specs
    console.log('📊 INDICATORS CHECK:\n')
    
    const totalIndicators = await IndicatorModel.countDocuments({})
    const withAffectedPairs = await IndicatorModel.countDocuments({ affectedPairs: { $exists: true, $ne: [] } })
    const withSpecs = await IndicatorModel.countDocuments({ 'info.0': { $exists: true } })
    
    console.log(`Total indicators: ${totalIndicators}`)
    console.log(`With affectedPairs: ${withAffectedPairs}`)
    console.log(`With specs (info): ${withSpecs}\n`)
    
    // Show sample indicator with specs
    const sampleWithSpecs = await IndicatorModel.findOne({ 'info.0': { $exists: true } })
    if (sampleWithSpecs) {
      console.log('Sample indicator with specs:')
      console.log(`  Name: ${sampleWithSpecs.name}`)
      console.log(`  Country: ${sampleWithSpecs.country}`)
      console.log(`  Affected Pairs: ${sampleWithSpecs.affectedPairs?.join(', ')}`)
      console.log(`  Specs count: ${sampleWithSpecs.info?.length || 0}`)
      if (sampleWithSpecs.info && sampleWithSpecs.info.length > 0) {
        console.log(`  First spec: ${sampleWithSpecs.info[0].title}`)
      }
      console.log('')
    }

    // Check publications
    console.log('📈 PUBLICATIONS CHECK:\n')
    
    const totalPublications = await IndicatorPublicationModel.countDocuments({})
    const withActual = await IndicatorPublicationModel.countDocuments({ actual: { $ne: null } })
    const withForecast = await IndicatorPublicationModel.countDocuments({ forecast: { $ne: null } })
    
    console.log(`Total publications: ${totalPublications}`)
    console.log(`With actual values: ${withActual}`)
    console.log(`With forecast values: ${withForecast}\n`)
    
    // Publications by indicator
    const pubsByIndicator = await IndicatorPublicationModel.aggregate([
      { $group: { _id: '$indicatorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
    
    console.log('Top 5 indicators by publication count:')
    for (const item of pubsByIndicator) {
      const indicator = await IndicatorModel.findById(item._id)
      if (indicator) {
        console.log(`  ${indicator.name}: ${item.count} publications`)
      }
    }
    console.log('')
    
    // Show sample publication
    const samplePub = await IndicatorPublicationModel.findOne({ actual: { $ne: null } })
    if (samplePub) {
      const indicator = await IndicatorModel.findById(samplePub.indicatorId)
      console.log('Sample publication:')
      console.log(`  Indicator: ${indicator?.name}`)
      console.log(`  Date: ${samplePub.ts.toISOString()}`)
      console.log(`  Actual: ${samplePub.actual}`)
      console.log(`  Forecast: ${samplePub.forecast}`)
      console.log(`  Previous: ${samplePub.previous}`)
      console.log('')
    }

    // Date range of publications
    const oldestPub = await IndicatorPublicationModel.findOne({}).sort({ ts: 1 })
    const newestPub = await IndicatorPublicationModel.findOne({}).sort({ ts: -1 })
    
    console.log('📅 Publication date range:')
    console.log(`  Oldest: ${oldestPub?.ts.toISOString()}`)
    console.log(`  Newest: ${newestPub?.ts.toISOString()}`)
    console.log('')

    console.log('✅ All checks completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkFinalData()
