const request = require('request');
const moment = require('moment');

const API_KEY = process.env.API_KEY;

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
