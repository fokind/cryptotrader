const request = require('request');
const moment = require('moment');

const API_KEY = process.env.API_KEY;

// Для примера:
// function getCapabilities() {
//   return {
//     name: 'Binance',
//     slug: 'binance',
//     currencies: ['BTC'],
//     assets: ['XMR', 'XRP'],
//     pairs:
//     maxHistoryFetch: 
//     providesHistory
//     markets: [{
//       pair: ['BTC', 'XMR'],
//       minimalOrder: {
//         amount: 1,
//         price: 1e-8,
//         order: 0.001
//       }
//     }, {
//       pair: ['BTC', 'XRP'],
//       minimalOrder: {
//         amount: 1,
//         price: 1e-8,
//         order: 0.001
//       }
//     }],
//     requires: ['key', 'secret'],
//     providesHistory: 'date',
//     providesFullHistory: true,
//     tid: 'tid',
//     tradable: true,
//     gekkoBroker: 0.6,
//     limitedCancelConfirmation: true
//   };
// };

/*
{
  "watch": {
      "exchange": "poloniex",
      "currency": "USDT",
      "asset": "BTC"
  },
  "daterange": {
      "to": "2018-07-03T05:53:00.000Z",
      "from": "2018-07-03T05:40:00.000Z"
  },
  "candleSize": 1
}
*/

// TODO добавить обработку да с по какой даты получать данные
// TODO в первой версии добавить выбор биржи для анализа
function getCandles({ source, exchange, currency, asset, period, limit, begin, end }, callback) { // TODO этот метод вынести в коннектор к бирже или др. поставщику статистики
  // source на случай, если источников будет много
  // внутри одного источника может быть ссылка на несколько самостоятельных бирж
  // биржа может являться источником

  const url = period === 'M1' ? 'histominute' : (period === 'H1' ? 'histohour' : 'histoday');

  request.get({
    baseUrl: 'https://min-api.cryptocompare.com/data/',
    url,
    headers: {
      authorization: `Apikey ${API_KEY}` // тоже может являться параметром
      // каждый пользователь может использовать собственную статистику
      // дополнительное преимущество: пользователь может не запрашивать новые данные, если другой пользователь их уже запрашивал
      // подумать как избержать конфликты при параллельном обращении к данным
      // типа блокировать отдельный запрос на изменение, каждому выполнять свой, а когда разблокируется выполнять дедупликацию и слияние в один большой массив данных
    },
    qs: {
      fsym: currency,
      tsym: asset,
      limit,
    },
  }, (err, res, body) => {
    callback(err, JSON.parse(body).Data.slice(0, -1).map(e => ({
      time: moment.unix(e.time).toDate(),
      open: +e.open,
      high: +e.high,
      low: +e.low,
      close: +e.close,
    })));
  });
};

module.exports = {
  getCandles,
};
