// import * as request from 'request';
// import * as moment from 'moment';
// import { IMarketDataSource } from '../engine/Exchange';

// export class Cryptocompare implements IMarketDataSource {
//   async getCandles(options: {
//     currency: string,
//     asset: string,
//     period: string,
//     begin?: Date,
//     end?: Date
//   }): Promise<Array<{
//     time: Date,
//     open: number,
//     high: number,
//     low: number,
//     close: number
//   }>> {
//     // TODO функцию сделать асинхронной
//     const { currency, asset, period, begin, end } = options;
//     // console.log("API_KEY:", API_KEY);
//     const url = period === 'M1' ? 'histominute' : (period === 'H1' ? 'histohour' : 'histoday');
//     const qs: any = {
//       tsym: currency,
//       fsym: asset,
//       // limit: 2000, // по умолчанию из документации, запрашивается с запасом, чтобы потом не загружать
//       // выполнить столько раз, чтобы получить всю статистику
//       toTs: moment(end).unix(),
//     };
//     // если начала нет, тогда просто выполнить один раз с пустым лимитом
//     // если есть, тогда получить результат и сверить, начало данных должно соответствовать
//     // возвращенные данные могут содержать пропуски
//     // необходимо изначально сформировать серию запросов, где указать toTs и limit
//     let candles = [];
//     let toTs = moment(end);
//     const MAX_LIMIT = 2000;
//     let duration = begin ? moment(end).diff(begin, period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd')) : MAX_LIMIT;
//     // console.log(duration);

//     while (duration > 0) {
//       // сначала просто обновить
//       // если данных недостаточно, то сдвинуть и посчитать еще раз
//       qs.limit = Math.min(duration, MAX_LIMIT);
//       duration -= qs.limit;
//       // console.log(duration);

//       if (qs.limit) candles = candles.concat(await new Promise<any>(resolve => {
//         const options = {
//           baseUrl: 'https://min-api.cryptocompare.com/data/',
//           url,
//           qs,
//         };
//         // console.log(options);
//         request.get(options, (err, res, body) => {
//           // console.log(JSON.parse(body).Data.length);
//           if (err) console.log(err);
//           try {
//             resolve(JSON.parse(body).Data.slice(0, -1).map(e => (<any>{
//               time: moment.unix(e.time).toDate(),
//               open: +e.open,
//               high: +e.high,
//               low: +e.low,
//               close: +e.close,
//             })));
//           } catch (error) {
//             console.log(JSON.parse(body));
//           }
//         });
//       }));
//       // console.log(period, period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd'));

//       toTs = toTs.add(-qs.limit, period === 'M1' ? 'm' : (period === 'H1' ? 'h' : 'd'));
//       qs.toTs = toTs.unix();
//       // console.log(begin, toTs, begin && moment(begin).isSameOrBefore(toTs));
      
//     }
//     // console.log(candles.length);
//     return candles;
//   };
// }
