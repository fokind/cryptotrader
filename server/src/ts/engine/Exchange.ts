import * as request from 'request';
import * as async from 'async';
import { Order } from '../models/Order';

const BASE_URL = 'https://api.hitbtc.com/api/2/';

function createOrder(options: {
  currency: string,
  asset: string,
  side: string, // TODO заменить на enum
  quantity: number,
  price: number,
  user: string,
  pass: string
}): Promise<void> {
  const { user, pass, asset, currency, side, quantity, price } = options;
  return new Promise<void>((resolve, reject) => {
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
        side,
        quantity,
        price,
      }
    }, (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

export class ExchangeEngine {
  static async getOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<Array<Order>> {
    const { currency, asset, user, pass } = options;
    return new Promise<Array<Order>>((resolve, reject) => {
      const TIMEOUT = 100;
      let orders;
      // TODO добавить счетчик, ограничивающий число попыток
      async.doDuring(
        callback => request.get({
          baseUrl: BASE_URL,
          url: 'order',
          qs: {
            symbol: asset + currency
          },
          auth: {
            user,
            pass
          }
        }, (err, res, body) => callback(undefined, res ? res.statusCode : undefined, body)),
        (statusCode, body, callback) => {
          if (statusCode === 200) {
            orders = JSON.parse(body).map(e => new Order({
              _id: e.clientOrderId,
              // createdAt: e.createdAt,
              // currency,
              // asset,
              // side: e.side,
              // quantity: +e.quantity,
              price: +(e.type === 'stopMarket' ? e.stopPrice : e.price),
            }));

            callback(undefined, false);
          } else setTimeout(() => { callback(undefined, true); }, TIMEOUT);
        },
        err => !err ? resolve(orders) : reject(err)
      );
    });
  };

  static async cancelOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<void> {
    const { currency, asset, user, pass } = options;
    return new Promise<void>((resolve, reject) => {
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
      }, (err) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  };

  static async buy(options: {
    currency: string,
    asset: string,
    quantity: number,
    price: number,
    user: string,
    pass: string
  }): Promise<void> {
    const { user, pass, asset, currency, quantity, price } = options;
    return createOrder({ user, pass, asset, currency, quantity, price, side: 'buy' });
  };

  static async sell(options: {
    currency: string,
    asset: string,
    quantity: number,
    price: number,
    user: string,
    pass: string
  }): Promise<void> {
    const { user, pass, asset, currency, quantity, price } = options;
    // TODO проверить на количество знаков и наличие валюты
    return createOrder({ user, pass, asset, currency, quantity, price, side: 'sell' });
  };

  static async getSymbol(options: {
    currency: string,
    asset: string,
  }): Promise<{ quantityIncrement: number, takeLiquidityRate: number }> {
    const { currency, asset } = options;
    return new Promise<{ quantityIncrement: number, takeLiquidityRate: number }>((resolve, reject) => {
      const TIMEOUT = 100;
      let symbol;
      // TODO добавить счетчик, ограничивающий число попыток
      async.doDuring(
        callback => request.get({
          baseUrl: BASE_URL,
          url: 'public/symbol/' + asset + currency
        }, (err, res, body) => callback(undefined, res ? res.statusCode : undefined, body)),
        (statusCode, body, callback) => {
          if (statusCode === 200) {
            const { quantityIncrement, takeLiquidityRate } = JSON.parse(body);
            symbol = {
              quantityIncrement: +quantityIncrement,
              takeLiquidityRate: +takeLiquidityRate
            };
            callback(undefined, false);
          } else setTimeout(() => { callback(undefined, true); }, TIMEOUT);
        },
        err => !err ? resolve(symbol) : reject(err)
      );
    });
  };

  static async getTicker(options: {
    currency: string,
    asset: string,
  }): Promise<{ ask: number, bid: number }> {
    const { currency, asset } = options;
    return new Promise<{ ask: number, bid: number }>((resolve, reject) => {
      const TIMEOUT = 100;
      let ticker;
      // TODO добавить счетчик, ограничивающий число попыток
      async.doDuring(
        callback => request.get({
          baseUrl: BASE_URL,
          url: 'public/ticker/' + asset + currency
        }, (err, res, body) => callback(undefined, res ? res.statusCode : undefined, body)),
        (statusCode, body, callback) => {
          if (statusCode === 200) {
            const { ask, bid } = JSON.parse(body);
            ticker = {
              ask: +ask,
              bid: +bid
            };
            callback(undefined, false);
          } else setTimeout(() => { callback(undefined, true); }, TIMEOUT);
        },
        err => !err ? resolve(ticker) : reject(err)
      );
    });
  };
  
  static async getPortfolio(options: {
    user: string,
    pass: string,
  }): Promise<Array<{ currency: string, available: number }>> {
    const { user, pass } = options;
    return new Promise<Array<{ currency: string, available: number }>>((resolve, reject) => {
      const TIMEOUT = 100;
      let portfolio;
      // TODO добавить счетчик, ограничивающий число попыток
      async.doDuring(
        callback => request.get({
          baseUrl: BASE_URL,
          url: 'trading/balance',
          auth: {
            user,
            pass,
          }
        }, (err, res, body) => callback(undefined, res ? res.statusCode : undefined, body)),
        (statusCode, body, callback) => {
          if (statusCode === 200) {
            portfolio = JSON.parse(body).filter(e => e.available !== "0").map(e => ({
              currency: e.currency,
              available: +e.available
            }));
            callback(undefined, false);
          } else setTimeout(() => { callback(undefined, true); }, TIMEOUT);
        },
        err => !err ? resolve(portfolio) : reject(err)
      );
    });
  };

  static async getCandles(options: {
    currency: string,
    asset: string,
    period: string,
    begin?: Date,
    end?: Date
  }): Promise<Array<{
    time: Date,
    open: number,
    high: number,
    low: number,
    close: number
  }>> {
    const { currency, asset, period, begin, end } = options;
    // TODO чтобы выгрузить за длительный период необходимо выполнить подряд несколько запросов
    return new Promise<Array<{
      time: Date,
      open: number,
      high: number,
      low: number,
      close: number
    }>>((resolve, reject) => {
      request.get({
        baseUrl: BASE_URL,
        url: `public/candles/${asset}${currency}`,
        qs: {
          // limit: 1000,
          period,
        },
      }, (err, res) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(JSON.parse(res.body).map(e => ({
              moment: e.timestamp, // UNDONE преобразовать в дату
              open: +e.open,
              high: +e.max,
              low: +e.min,
              close: +e.close,
            })));
          }
        }
      );
    });
  };
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
