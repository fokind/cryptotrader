import * as request from 'request';
import * as async from 'async';
// import { Order } from '../models/Order';
import { SideEnum, IExchange, IMarketDataSource } from '../engine/Exchange';
import moment = require('moment');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

export class Hitbtc implements IExchange, IMarketDataSource {
  // если есть price, тогда это лимитный ордер
  async createOrder(options: {
    currency: string,
    asset: string,
    side: SideEnum,
    quantity: number,
    price?: number,
    user: string,
    pass: string
  }): Promise<void> {
    const { user, pass, asset, currency, side, quantity, price } = options;
    // console.log({
    //   symbol:  asset + currency,
    //   side: side ? 'buy' : 'sell',
    //   quantity,
    //   type: price ? 'limit' : 'market',
    //   postOnly: !!price
    // });
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
          side: side ? 'buy' : 'sell',
          quantity,
          type: price ? 'limit' : 'market',
          price,
          postOnly: !!price
        }
      }, (err, res) => {
          // console.log(res);
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

  async getOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<{ price: number, _id: string }[]> {
    const { currency, asset, user, pass } = options;
    return new Promise<{ price: number, _id: string }[]>((resolve, reject) => {
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
            orders = JSON.parse(body).map(e => ({
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

  async cancelOrders(options: {
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

  async getSymbol(options: {
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

  async getTicker(options: {
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
  
  async getPortfolio(options: {
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

  async getCandles(options: {
    currency: string,
    asset: string,
    period: string,
    begin?: Date, // FIXME заменить на число или строку, чтобы исключить часовой пояс для даты
    end?: Date
  }): Promise<Array<{
    time: Date,
    open: number,
    high: number,
    low: number,
    close: number
  }>> {
    const { currency, asset, period, begin, end } = options;
    const url = `public/candles/${asset}${currency}`;
    const qs: any = {
      period
    };

    if (begin) qs.from = moment(begin).toISOString();
    // UNDONE !!! должно из локального переводиться в UTC

    let candles = [];
    const MAX_LIMIT = 1000;
    const TIMEOUT = 100;
    let from = moment(begin);
    let duration = begin ? moment(end).diff(begin, period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd')) : MAX_LIMIT;

    while (duration > 0) {
      qs.limit = Math.min(duration, MAX_LIMIT);
      if (qs.limit) candles = candles.concat(await new Promise<any>(resolve => {
        const options = {
          baseUrl: BASE_URL,
          url,
          qs,
        };
        request.get(options, (err, res, body) => {
          if (err) console.log(err);
          if (res && res.statusCode === 200) {
            resolve(JSON.parse(body).slice(0, -1).map(e => (<any>{
              time: moment(e.timestamp).toDate(),
              open: +e.open,
              high: +e.max,
              low: +e.min,
              close: +e.close,
            })));
            duration -= qs.limit;
          } else {
            setTimeout(() => { resolve([]); }, TIMEOUT);
          }
        });
      }));
      from = from.add(qs.limit, period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd'));
      qs.from = from.toISOString();
    }

    return candles;
  };
};
