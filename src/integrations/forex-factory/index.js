// npm i puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // headless: false для обхода Cloudflare
  const page = await browser.newPage();
  
  // Ждём полной загрузки включая сетевые запросы
  await page.goto('https://www.forexfactory.com/calendar', { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  // Даём странице время на инициализацию JS и прохождение Cloudflare
  await new Promise(resolve => setTimeout(resolve, 5000));

  // создаём CDP-сессию для целевой вкладки
  const client = await page.target().createCDPSession();

  // Получаем CSRF токен со страницы (несколько вариантов)
  const csrfToken = await page.evaluate(() => {
    // Вариант 1: из meta тега
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) return metaTag.content;
    
    // Вариант 2: из глобальной переменной
    if (window.csrfToken) return window.csrfToken;
    
    // Вариант 3: из cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token' || name === 'XSRF-TOKEN') {
        return value;
      }
    }
    
    // Вариант 4: попробуем найти в скриптах или данных страницы
    const scripts = Array.from(document.scripts);
    for (let script of scripts) {
      const match = script.textContent.match(/csrf[_-]?token['"]?\s*[:=]\s*['"]([^'"]+)['"]/i);
      if (match) return match[1];
    }
    
    return null;
  });

  console.log('CSRF Token:', csrfToken || 'Not found, trying without it...');

  // Загружаем скрипт из файла
  const scriptPath = path.join(__dirname, 'fetch-calendar.js');
  const browserScript = fs.readFileSync(scriptPath, 'utf-8');

  // выполнит выражение так же, как DevTools Console
  const resp = await client.send('Runtime.evaluate', {
    expression: browserScript,
    awaitPromise: true, // дождётся выполнения промиса
    returnByValue: true, // вернёт value прямо в node
  });

  const result = resp.result.value;
  
  console.log('CDP result:', JSON.stringify(result, null, 2));

  // Сохраняем результат в JSON файл
  const outputPath = path.join(__dirname, 'forex-calendar-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n✅ Данные сохранены в файл: ${outputPath}`);
  console.log(`📊 Всего событий: ${result.totalEvents || 0}`);
  console.log(`📅 Всего дней: ${result.totalDays || 0}`);

  await browser.close();
})();
