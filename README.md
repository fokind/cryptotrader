# Cryptotrader
Бот для торговли на криптовалютных биржах.
На данный момент разработан только функционал бэктеста (теста на исторических данных взятых с CryptoCompare).

## Подготовка
1. Установите node js
2. Установите MongoDB "mongodb://localhost:27017/crypto"
3. Создайте API Key на портале https://min-api.cryptocompare.com/

## Установка
1. npm install
2. Устраните ошибку в OData Server
3. в файле .env добавьте переменную API_KEY, которую создали на портале со статистикой
4. npm run build

## Запуск
1. npm start
Приложение использует порт 3000 по умолчанию.
2. Откройте в браузере http://localhost:3000/

## Использование
1. Создайте первую стратегию и откройте.
2. На экране слева CodeEditor введите стратегию для примера:

// module.exports = function(candles, tulind, callback)
{
    const PERIOD = 14;

    if (candles.length < PERIOD * 2 - 1) {
        callback(null, 0);
    } else {
        const high = candles.map(e => e.high).slice(-(PERIOD * 2 - 1));
        const low = candles.map(e => e.low).slice(-(PERIOD * 2 - 1));
        const close = candles.map(e => e.close).slice(-(PERIOD * 2 - 1));
    
        tulind.indicators.cci.indicator([ high, low, close ], [ PERIOD ]).then(([ ccis ]) => {
            const advice = (ccis.length > 0) ? (ccis[0] >= 100 ? 1 : -1) : 0;
            callback(null, advice);
        });
    }
}

Стратегию можно изменить.
Комментарий первой строки не удаляйте.
Через 1 - 3 секунды произойдет сохранение.
2. На экране справа создайте Бэктест.
В диапазоне дат выберите только вчерашний день (для минутного интервала доступны только сутки).
В качестве приода можно выбрать только M1, H1 или D1.
Символы валют для остальных полей можете взять с сайта со статистикой.
3. Запустите расчет и додждитесь выполнения.
В двух правых столбцах будет изменение рынка за сутки и эффективность стратегии.
4. Для просмотра деталей можно перйти на страницу бэктеста.
