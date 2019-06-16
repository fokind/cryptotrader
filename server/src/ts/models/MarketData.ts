import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Candle } from "./Candle";
import * as _ from 'lodash';
import { ExchangeEngine } from "../engine/Exchange";
import connect from "../connect";
import * as moment from 'moment';

export class MarketData {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public exchangeKey: string

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public timeframe: string // https://ru.wikipedia.org/wiki/%D0%A2%D0%B0%D0%B9%D0%BC%D1%84%D1%80%D0%B5%D0%B9%D0%BC
  
  // moment.duration('P1Y2M3DT4H5M6S');

  @Edm.String
  public start?: string;
  // moment().format(); // "2014-09-08T08:02:00" (ISO 8601, no fractional seconds)
  // moment(1318874398806).unix(); // 1318874398

  @Edm.String
  public end?: string;

  // @Edm.Boolean
  // public live: boolean; // если да, то end игнорируется и всегда равен текущему значению
  // необходим для поддержания данных в актуальном состоянии
  // есть ограничения источников, данные предоставляются за ограниченный период,
  // если разрыв будет велик, то продолжить поддерживать будет нельзя

  // @Edm.String
  // public accountId: ObjectID
  // здесь требуется только API_KEY

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[]

  // @Edm.Action
  // async update(@odata.result result: any, @Edm.DateTimeOffset begin?: Date, @Edm.DateTimeOffset end?: Date): Promise<number> {
  //   const db = await connect();
  //   const marketData = await db.collection("marketData").findOne({ _id: this._id });
  //   const { currency, asset, period, _id, begin: marketDataBegin, end: marketDataEnd } = marketData;
  //   const exchange = 'hitbtc';

  //   let diff: Candle[];

  //   if (!marketDataEnd) {
  //     diff = (await ExchangeEngine
  //       .getCandles(exchange, { currency, asset, period, begin, end })).map(e => new Candle(e));
  //   } else {
  //     diff = (moment(end).isAfter(marketDataEnd) ? (await ExchangeEngine
  //       .getCandles(exchange, { currency, asset, period, begin: moment(marketDataEnd).add(1, 'm').toDate(), end })) : []).concat(
  //         moment(begin).isBefore(marketDataBegin) ? (await ExchangeEngine
  //           .getCandles(exchange, { currency, asset, period, begin, end: moment(marketDataBegin).add(-1, 'm').toDate() })) : []
  //         ).map(e => new Candle(e));
  //   }
    
  //   const { length } = diff;

  //   if (length) {
  //     let deltaBegin = marketDataBegin ? marketDataBegin : diff[0].time;
  //     let deltaEnd = marketDataEnd ? marketDataEnd : diff[0].time;
  //     for (let i = 0; i < length; i++) {
  //       if (moment(diff[i].time).isBefore(deltaBegin)) deltaBegin = diff[i].time;
  //       if (moment(diff[i].time).isAfter(deltaEnd)) deltaEnd = diff[i].time;
  //     }
  //     const delta: { begin?: Date, end?: Date } = {};

  //     if (deltaBegin !== marketDataBegin) delta.begin = deltaBegin;
  //     if (deltaEnd !== marketDataEnd) delta.end = deltaEnd;

  //     const db = await connect();
  //     await db.collection("candle").insertMany(diff.map(e => {
  //       e.marketDataId = _id;
  //       return e;
  //     }));

  //     await db.collection("marketData").updateOne({ _id }, { $set: delta });

  //     return 1;
  //   } else {
  //     return 0;
  //   }
  // }

  constructor(
    { _id, exchangeKey, currency, asset, timeframe, start, end }:
    { _id: ObjectID, exchangeKey: string, currency: string, asset: string, timeframe: string, start?: string, end?: string }
  ) {
    Object.assign(this, { _id, exchangeKey, currency, asset, timeframe });
    if (start) this.start = start;
    if (end) this.end = end;
  }
}
