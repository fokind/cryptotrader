import * as request from 'request';
import * as moment from 'moment';

const API_KEY = process.env.API_KEY; // UNDONE

export class MarketDataEngine {
  static async getCandles(options: {
    currency: string,
    asset: string,
    period: string,
    begin?: Date,
    end?: Date
  }): Promise<{
    time: number,
    open: number,
    high: number,
    low: number,
    close: number
  }[]> {
    const { currency, asset, period, begin, end } = options;
    return new Promise<any>(resolve => {
      const url = period === 'M1' ? 'histominute' : (period === 'H1' ? 'histohour' : 'histoday');
      const qs: any = {
        tsym: currency,
        fsym: asset,
        toTs: moment(end).unix(),
      };

      if (end) qs.toTs = moment(end).unix();
      if (begin) qs.limit = moment(end).diff(moment(begin), period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd'));

      request.get({
        baseUrl: 'https://min-api.cryptocompare.com/data/',
        url,
        headers: {
          authorization: `Apikey ${API_KEY}`
        },
        qs,
      }, (err, res, body) => {
        resolve(JSON.parse(body).Data.slice(0, -1).map(e => (<any>{
          time: moment.unix(e.time).toDate(),
          open: +e.open,
          high: +e.high,
          low: +e.low,
          close: +e.close,
        })));
      });      
    });
  };
}