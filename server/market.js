const request = require('request');

function getCandles({ fsym, tsym, period, limit }, callback) { // TODO этот метод вынести в коннектор к бирже или др. поставщику статистики
  request.get({
    baseUrl: 'https://api.hitbtc.com/api/2/',
    url: `public/candles/${tsym}${fsym}`,
    qs: {
      limit,
      period,
    },
  }, (err, res, body) => {
    callback(err, JSON.parse(body).slice(0, -1).map(e => ({
      time: e.timestamp,
      open: +e.open,
      high: +e.max,
      low: +e.min,
      close: +e.close,
    })));
  });
};

module.exports = {
  getCandles,
};
