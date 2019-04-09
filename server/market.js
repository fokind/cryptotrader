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

function getCandles({ fsym, tsym, period, limit }, callback) { // TODO этот метод вынести в коннектор к бирже или др. поставщику статистики
  const url = period === 'M1' ? 'histominute' : (period === 'H1' ? 'histohour' : 'histoday');

  request.get({
    baseUrl: 'https://min-api.cryptocompare.com/data/',
    url,
    headers: {
      authorization: `Apikey ${API_KEY}`
    },
    qs: {
      fsym,
      tsym,
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
