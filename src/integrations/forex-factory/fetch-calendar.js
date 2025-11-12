// Скрипт для выполнения в контексте браузера
// Принимает параметры: beginDate, endDate, currencies
(async (beginDate, endDate, currencies) => {
    try {
        let Events = [];
        let Days = [];

        // Получаем CSRF токен из meta тега или других источников на странице
        const getCsrfToken = () => {
            const meta = document.querySelector('meta[name="csrf-token"]');
            if (meta) return meta.content;

            // Ищем в cookie
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'csrf_token' || name === 'XSRF-TOKEN') return value;
            }

            // Ищем в scripts
            const scripts = Array.from(document.scripts);
            for (let script of scripts) {
                const match = script.textContent.match(/csrf[_-]?token['"]?\s*[:=]\s*['"]([^'"]+)['"]/i);
                if (match) return match[1];
            }

            return null;
        };

        const csrfToken = getCsrfToken();

        const headers = {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json"
        };

        if (csrfToken) {
            headers["x-csrf-token"] = csrfToken;
        }

        const response = await fetch("https://www.forexfactory.com/calendar/apply-settings/100000?navigation=0", {
            headers,
            referrer: "https://www.forexfactory.com/",
            body: JSON.stringify({
                default_view: "today",
                impacts: [3,2,1,0],
                event_types: [1, 2, 3, 4, 5, 7, 8, 9],
                currencies: currencies || [1,2,3,4,5,6,7,8,9],
                begin_date: beginDate,
                end_date: endDate
            }),
            method: "POST",
            mode: "cors",
            credentials: "include"
        });

        const responseText = await response.text();

        // Если это не JSON, возвращаем информацию для отладки
        if (!responseText.startsWith('{') && !responseText.startsWith('[')) {
            return {
                error: 'Not JSON response',
                status: response.status,
                preview: responseText.substring(0, 500),
                foundCsrf: !!csrfToken
            };
        }

        const data = JSON.parse(responseText);

        if (data.days) {
            data.days.forEach((day) => Events = [...Events, ...day.events]);
            Days = [...Days, ...data.days];
        }

        return {
            Days,
            Events,
            totalEvents: Events.length,
            totalDays: Days.length
        };
    } catch (error) {
        return { error: error.message, stack: error.stack };
    }
})
