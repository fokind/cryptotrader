import * as request from 'request';
import * as async from 'async';
// import { Order } from '../models/Order';
import { SideEnum, IExchange, IMarketDataSource, ICandle } from '../engine/Exchange';
import moment = require('moment');

const BASE_URL = 'https://api.hitbtc.com/api/2/';
const CANDLES_LIMIT = 1000;

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
         /* qs: {
            symbol: asset + currency
          },*/
          auth: {
            user,
            pass
          }
        }, (err, res, body) => callback(undefined, res ? res.statusCode : undefined, body)),
        (statusCode, body, callback) => {
          if (statusCode === 200) {
            // console.log(body);
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
  }): Promise<{ quantityIncrement: number, takeLiquidityRate: number, tickSize: number }> {
    const { currency, asset } = options;
    return new Promise<{ quantityIncrement: number, takeLiquidityRate: number, tickSize: number }>((resolve, reject) => {
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
            const { quantityIncrement, takeLiquidityRate, tickSize } = JSON.parse(body);
            symbol = {
              quantityIncrement: +quantityIncrement,
              takeLiquidityRate: +takeLiquidityRate,
              tickSize: +tickSize
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

  // static timeframeFormatter(timeframe: string): string {
  //   return timeframe;
  // };
  // M1, M3, M5, M15, M30, H1, H4, D1, D7, 1M
  // хотя правильно MN

  // UNDONE перевести в общепринятые обозначения
  static timeframeToMinutes(timeframe: string): number {
    let duration = 'P';
    if (timeframe === '1M') {
      duration += timeframe;
    } else if (['D1', 'D7'].indexOf(timeframe) > -1) {
      duration += timeframe.slice(1) + timeframe.slice(0, 1);
    } else if (['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H4'].indexOf(timeframe) > -1) {
      duration += 'T' + timeframe.slice(1) + timeframe.slice(0, 1);
    }

    // console.log(duration);
    return moment.duration(duration).asMinutes(); // FIXME для месяца не сработает
  };

  static timeframeToTimeunits(timeframe: string): any {
    let timeunits;
    if (timeframe === '1M') {
      timeunits = 'M';
    } else if (['D1', 'D7'].indexOf(timeframe) > -1) {
      timeunits = 'D';
    } else if (['M1', 'M3', 'M5', 'M15', 'M30'].indexOf(timeframe) > -1) {
      timeunits = 'm';
    } else if (['H1', 'H4'].indexOf(timeframe) > -1) {
      timeunits = 'h';
    }
    return timeunits;
  };

  async _requestCandles(url: string, period: string, limit: number, from: string): Promise<ICandle[]> {
    // console.log(from);
    const options = {
      baseUrl: BASE_URL,
      url,
      qs: {
        period,
        from,
        limit
      },
    };

    return new Promise(function(resolve) {
      request.get(options, (err, res, body) => {
        // UNDONE добавить обработку ошибок как везде

        // resolve(JSON.parse(body).slice(0, -1).map(e => (<any>{ // обрезать можно только у текущего значения
        // console.log(JSON.parse(body));
        resolve(JSON.parse(body).map(e => (<any>{
          time: moment(e.timestamp).toISOString(),
          open: +e.open,
          high: +e.max,
          low: +e.min,
          close: +e.close
        })));
      });
    });
  };

  // TODO перенести логику работы с лимитом в обобщающий класс
  async getCandles({ currency, asset, timeframe, start, end }: {
    currency: string,
    asset: string,
    timeframe: string,
    start?: string,
    end?: string
  }): Promise<ICandle[]> {
    const url = `public/candles/${asset}${currency}`;
    // console.log({ currency, asset, timeframe, start, end });

    const startMoment = moment.utc(start);
    // console.log(startMoment.toISOString());
    const endMoment = moment.utc(end);
    // console.log(endMoment.toISOString());

    const timeframeMinutes = Hitbtc.timeframeToMinutes(timeframe);
    const rangeMinutes = endMoment.diff(startMoment, 'm');
    const ticks = rangeMinutes / timeframeMinutes;
    const iterations = ticks / CANDLES_LIMIT;
    
    // console.log(rangeMinutes, timeframeMinutes, ticks, iterations);

    // цикл по этим итерациям
    const candles: ICandle[] = [];
    for (let index = 0; index < iterations; index++) {
      // start каждый раз увеличивать
      // CANDLES_LIMIT * timeframeMinutes
      const response = await this._requestCandles(url, timeframe, CANDLES_LIMIT, startMoment.toISOString());
      // console.log(response);
      for (let i = 0; i < response.length; i++) {
        // console.log(response[i]);
        candles.push(response[i]);
      }
      startMoment.add(CANDLES_LIMIT * timeframeMinutes, 'm');
    }

    // const range = moment.range(startMoment, endMoment);

    // console.log(startMoment, endMoment, range);
    // определить количество тиков

    // const periodMoment = moment.duration(period);
    // console.log(periodMoment);

    // const periodFormated = 'M1';
    // PT1M
    // const duration = Hitbtc.timeframeToDuration(timeframe);

    // console.log(candles);
   
    return candles.slice(0, -1);
  };
};
