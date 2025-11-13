# Currency and Currency Pairs Constants

## Расположение

Все маппинги валют и валютных пар находятся в:
```
src/shared/constants/
├── currencies.ts      # TypeScript версия для основного приложения
├── currencies.js      # JavaScript версия для скриптов
├── currency-pairs.ts  # Определения валютных пар
└── index.ts          # Экспорт всех констант
```

## Использование

### В TypeScript файлах

```typescript
import { 
  Currency, 
  FOREX_FACTORY_CURRENCY_IDS,
  getCurrencyByCountry,
  getForexFactoryId 
} from '../shared/constants'

// Enum валют
const euro = Currency.EUR // 'EUR'

// Получить Forex Factory ID
const eurId = getForexFactoryId(Currency.EUR) // 5

// Получить валюту по коду страны
const usCurrency = getCurrencyByCountry('US') // Currency.USD

// Проверка валидности
import { isValidCurrency } from '../shared/constants'
if (isValidCurrency('EUR')) {
  // EUR is valid
}
```

### В JavaScript файлах

```javascript
const { FOREX_FACTORY_CURRENCY_IDS, CURRENCY_NAMES } = require('../../shared/constants/currencies')

// Использование ID
const targetCurrencies = [
  FOREX_FACTORY_CURRENCY_IDS.EUR,  // 5
  FOREX_FACTORY_CURRENCY_IDS.USD,  // 9
  FOREX_FACTORY_CURRENCY_IDS.GBP,  // 6
  FOREX_FACTORY_CURRENCY_IDS.JPY   // 7
]

// Имена валют
const name = CURRENCY_NAMES.EUR // 'Euro'
```

### Валютные пары

```typescript
import { 
  MAJOR_PAIRS,
  CROSS_PAIRS,
  getPairByNotation,
  getAffectedPairs,
  Currency
} from '../shared/constants'

// Получить пару
const eurUsd = getPairByNotation('EUR/USD')
// { base: 'EUR', quote: 'USD', symbol: 'EURUSD', name: 'Euro / US Dollar' }

// Получить все пары с конкретной валютой
const eurPairs = getAffectedPairs([Currency.EUR])
// Вернет все пары, где EUR - base или quote

// Major пары
const majors = Object.values(MAJOR_PAIRS)
// EUR/USD, GBP/USD, USD/JPY, etc.

// Cross пары
const crosses = Object.values(CROSS_PAIRS)
// EUR/GBP, EUR/JPY, GBP/JPY, etc.
```

## Forex Factory Currency IDs

| Currency | ID | Full Name |
|----------|-----|-----------|
| EUR | 5 | Euro |
| GBP | 6 | British Pound |
| JPY | 7 | Japanese Yen |
| CHF | 8 | Swiss Franc |
| USD | 9 | US Dollar |
| AUD | 10 | Australian Dollar |
| CAD | 11 | Canadian Dollar |
| NZD | 12 | New Zealand Dollar |

## Country to Currency Mapping

```typescript
US → USD
EU, EZ → EUR
UK, GB → GBP
JP → JPY
CH → CHF
AU → AUD
CA → CAD
NZ → NZD
```

## Примеры использования в проекте

### 1. В скрипте скрапинга (fetch-yearly-data.js)

```javascript
const { FOREX_FACTORY_CURRENCY_IDS } = require('../../shared/constants/currencies')

const TARGET_CURRENCIES = [
  FOREX_FACTORY_CURRENCY_IDS.EUR,
  FOREX_FACTORY_CURRENCY_IDS.USD,
  FOREX_FACTORY_CURRENCY_IDS.GBP,
  FOREX_FACTORY_CURRENCY_IDS.JPY
]
```

### 2. В трансформации данных (import-to-db.ts)

```typescript
import { getCurrencyByCountry } from '../../shared/constants'

function getAffectedCurrencies(currencyCode: string, country: string): string[] {
  const currencies = [currencyCode]
  const countryCurrency = getCurrencyByCountry(country)
  if (countryCurrency && !currencies.includes(countryCurrency)) {
    currencies.push(countryCurrency)
  }
  return currencies
}
```

### 3. В валидации API

```typescript
import { isValidCurrency, Currency } from '../../shared/constants'

router.get('/indicators', (req, res) => {
  const { currencies } = req.query
  
  if (currencies) {
    const currencyList = currencies.split(',')
    const invalid = currencyList.filter(c => !isValidCurrency(c))
    
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Invalid currencies: ${invalid.join(', ')}`
      })
    }
  }
  
  // ...
})
```

### 4. В бизнес-логике

```typescript
import { getAffectedPairs, Currency } from '../../shared/constants'

// Получить все валютные пары, на которые влияет индикатор
function getAffectedPairsForIndicator(indicator: IIndicator): CurrencyPair[] {
  const currencies = indicator.affectedCurrencies as Currency[]
  return getAffectedPairs(currencies)
}

// Пример: если индикатор влияет на USD и EUR
// Вернет: EUR/USD, GBP/USD, USD/JPY, USD/CHF, EUR/GBP, EUR/JPY, и т.д.
```

## Преимущества централизованного хранения

✅ **Единственный источник истины** - все ID и маппинги в одном месте  
✅ **Type safety** - TypeScript enum и типы предотвращают ошибки  
✅ **Легко поддерживать** - изменения в одном месте  
✅ **Переиспользование** - используется в TypeScript и JavaScript файлах  
✅ **Документация** - функции с описанием и примерами  
✅ **Валидация** - встроенные функции проверки

## Добавление новой валюты

1. Добавить в `currencies.ts`:
```typescript
export enum Currency {
  // ... existing
  SEK = 'SEK'  // Swedish Krona
}

export const FOREX_FACTORY_CURRENCY_IDS: Record<Currency, number> = {
  // ... existing
  [Currency.SEK]: 13
}

export const CURRENCY_NAMES: Record<Currency, string> = {
  // ... existing
  [Currency.SEK]: 'Swedish Krona'
}
```

2. Добавить в `currencies.js`:
```javascript
const FOREX_FACTORY_CURRENCY_IDS = {
  // ... existing
  SEK: 13
}
```

3. При необходимости добавить валютные пары в `currency-pairs.ts`

4. Обновить маппинг стран, если нужно:
```typescript
export const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // ... existing
  'SE': Currency.SEK
}
```

## Тестирование

```typescript
import { 
  getForexFactoryId, 
  getCurrencyByCountry,
  Currency 
} from './shared/constants'

// Тест 1: Forex Factory IDs
console.assert(getForexFactoryId(Currency.EUR) === 5)
console.assert(getForexFactoryId(Currency.USD) === 9)

// Тест 2: Country mapping
console.assert(getCurrencyByCountry('US') === Currency.USD)
console.assert(getCurrencyByCountry('EZ') === Currency.EUR)

// Тест 3: Валидация
import { isValidCurrency } from './shared/constants'
console.assert(isValidCurrency('EUR') === true)
console.assert(isValidCurrency('XXX') === false)
```

---

**Важно**: После изменения констант не забудьте перекомпилировать TypeScript (`npm run build`)
