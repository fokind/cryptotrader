const request = require('request');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

// function getActiveOrders(options, callback) {
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

// function deleteOrder({ auth, body }, callback) {
//   // удаляет все ордеры
//   request.delete({
//     baseUrl: BASE_URL,
//     url: 'order',
//     auth,
//     json: true,
//     body,
//   }, (err, res) => {
//     callback(err, res);
//   });
// };

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

// function getSymbol(symbol, callback) {
//   request.get({
//     baseUrl: BASE_URL,
//     url: 'public/symbol/' + symbol
//   }, (err1, res1, body1) => {
//     if (err1) callback(err1);
//     callback(null, JSON.parse(body1));
//   });
// };

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
  // getOrders,
  // deleteOrder,
  // createOrder,
  // getCandles,
  // getSymbols,
  // getSymbol,
  getTicker,
  getPortfolio,
};
