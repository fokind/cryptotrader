const request = require('request');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

function getOrders({ currency, asset, user, pass }, callback) {
  request.get(
    {
      baseUrl: BASE_URL,
      url: 'order',
      qs: {
        symbol: asset + currency
      },
      auth: {
        user,
        pass
      }
    },
    (err, res) => {
      callback(
        err,
        JSON.parse(res.body).map(e => ({
          _id: e.clientOrderId,
          createdAt: e.createdAt,
          currency,
          asset,
          side: e.side,
          // type: e.type,
          quantity: +e.quantity,
          price: +(e.type === 'stopMarket' ? e.stopPrice : e.price),
        }))
      );
    }
  );
};

// function getOrders(options, callback) {
//   var { symbol, user, pass } = options;
//   request.get(
//     {
//       baseUrl: BASE_URL,
//       url: 'order',
//       qs: {
//         symbol
//       },
//       auth: {
//         user,
//         pass
//       }
//     },
//     (err, res) => {
//       callback(
//         err,
//         JSON.parse(res.body).map(e => ({
//           clientOrderId: e.clientOrderId,
//           createdAt: e.createdAt,
//           symbol: e.symbol,
//           side: e.side,
//           type: e.type,
//           quantity: +e.quantity,
//           price: +(e.type === 'stopMarket' ? e.stopPrice : e.price),
//         }))
//       );
//     }
//   );
// };

function deleteOrders({ user, pass, asset, currency }, callback) {
  // удаляет все ордеры, относящиеся к символу
  request.delete({
    baseUrl: BASE_URL,
    url: 'order',
    auth: {
      user,
      pass
    },
    body: {
      symbol: asset + currency
    },
    json: true,
  }, (err, res) => {
    callback(err, res);
  });
};

function buy({ user, pass, asset, currency, quantity, price }, callback) {
  request.post({
    baseUrl: BASE_URL,
    url: 'order',
    auth: {
      user,
      pass
    },
    json: true,
    body: {
      symbol:  asset + currency,
      side: 'buy',
      quantity,
      price,
    }
  }, (err, res) => {
    callback(err, res);
  });
};

function sell({ user, pass, asset, currency, quantity, price }, callback) {
  request.post({
    baseUrl: BASE_URL,
    url: 'order',
    auth: {
      user,
      pass
    },
    json: true,
    body: {
      symbol:  asset + currency,
      side: 'sell',
      quantity,
      price,
    }
  }, (err, res) => {
    callback(err, res);
  });
};

// function createOrder(options, callback) {
//   var { auth, body } = options;
//   var { symbol, side, quantity, price } = body;
//   request.post({
//     baseUrl: BASE_URL,
//     url: 'order',
//     auth,
//     json: true,
//     body: {
//       symbol,
//       side,
//       quantity,
//       price,
//     }
//   }, (err, res) => {
//     callback(err, res);
//   });
// };

// function getCandles({ symbol, period }, callback) {
//   request.get({
//     baseUrl: BASE_URL,
//     url: `public/candles/${symbol}`,
//     qs: {
//       limit: 1000,
//       period,
//     },
//   }, (err1, res1, body) => {
//     callback(err1, JSON.parse(body).map(e => ({
//       moment: e.timestamp,
//       open: +e.open,
//       high: +e.max,
//       low: +e.min,
//       close: +e.close,
//     })));
//   });
// };

function getSymbol({ currency, asset }, callback) {
  request.get({
    baseUrl: BASE_URL,
    url: 'public/symbol/' + asset + currency
  }, (err, res, body) => {
    if (err) callback(err);
    var { quantityIncrement, takeLiquidityRate } = JSON.parse(body);
    callback(null, {
      quantityIncrement: +quantityIncrement,
      takeLiquidityRate: +takeLiquidityRate
    });
  });
};

// function getSymbols(callback) {
//   request.get({
//     baseUrl: BASE_URL,
//     url: 'public/symbol'
//   }, (err1, res1, body1) => {
//     if (err1) callback(err1);
//     callback(null, JSON.parse(body1));
//   });
// };

function getTicker({ currency, asset }, callback) {
  request.get({
    baseUrl: BASE_URL,
    url: 'public/ticker/' + asset + currency
  }, (err, res, body) => {
    if (err) callback(err);
    var jBody = JSON.parse(body);
    callback(null, {
      // volume: +jBody.volume,
      // volumeQuote: +jBody.volumeQuote,
      ask: +jBody.ask,
      bid: +jBody.bid
    });
  });
};

function getPortfolio({ user, pass }, callback) {
  request.get({
    baseUrl: BASE_URL,
    url: 'trading/balance',
    auth: {
      user,
      pass,
    }
  }, (err1, res1, body1) => {
    callback(null, JSON.parse(body1).filter(e => e.available !== "0").map(e => ({
      currency: e.currency,
      available: +e.available
    })));
  });
};

module.exports = {
  // getActiveOrders,
  getOrders,
  buy,
  sell,
  deleteOrders,
  // createOrder,
  // getCandles,
  // getSymbols,
  getSymbol,
  getTicker,
  getPortfolio,
};
