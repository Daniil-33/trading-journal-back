/**
 * Quick script to check indicator data in MongoDB
 */

import 'dotenv/config'
import { connectDatabase } from '../../infrastructure/database/connection'
import { IndicatorModel } from '../../infrastructure/database/models/IndicatorModel'

async function checkData() {
  try {
    console.log('🔌 Connecting to database...')
    await connectDatabase()
    console.log('✅ Connected\n')

    // Get first 3 indicators
    const indicators = await IndicatorModel.find({}).limit(3)
    
    console.log(`📊 Found ${indicators.length} indicators (showing first 3):\n`)
    
    indicators.forEach((ind, idx) => {
      console.log(`${idx + 1}. ${ind.name}`)
      console.log(`   Country: ${ind.country}`)
      console.log(`   Affected Currencies: ${ind.affectedCurrencies.join(', ')}`)
      console.log(`   Affected Pairs: ${ind.affectedPairs?.join(', ') || 'N/A'}`)
      console.log(`   Info (specs): ${ind.info?.length || 0} items`)
      console.log('')
    })

    // Count indicators with affectedPairs
    const withPairs = await IndicatorModel.countDocuments({ affectedPairs: { $exists: true, $ne: [] } })
    const total = await IndicatorModel.countDocuments({})
    
    console.log(`📈 Statistics:`)
    console.log(`   Total indicators: ${total}`)
    console.log(`   With affectedPairs: ${withPairs}`)
    console.log(`   Without affectedPairs: ${total - withPairs}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkData()
