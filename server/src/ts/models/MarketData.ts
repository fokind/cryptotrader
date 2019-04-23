import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Candle } from "./Candle";
import * as _ from 'lodash';
import { MarketDataEngine } from "../engine/Market";
import connect from "../connect";
import * as moment from 'moment';

export class MarketData {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public period: string

  @Edm.DateTimeOffset
  public begin: Date;

  @Edm.DateTimeOffset
  public end: Date;

  // @Edm.Boolean
  // public live: boolean; // если да, то end игнорируется и всегда равен текущему значению

  // @Edm.String
  // public accountId: ObjectID
  // здесь требуется только API_KEY

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[]

  @Edm.Action
  async update(@odata.result result: any, @Edm.DateTimeOffset begin?: Date, @Edm.DateTimeOffset end?: Date): Promise<number> {
    // если указано начало, то найти наименьшее из текущего начала и параметра
    // если указан конец, то найти наибольшее из текущего и параметра
    const db = await connect();
    const marketData = await db.collection("marketData").findOne({ _id: this._id });
    const { currency, asset, period, _id, begin: marketDataBegin, end: marketDataEnd } = marketData;

    // первый более свежие, если дата конца позднее текущей
    // берем разницу между параметром и текущей последней датой

    // если текущих нет
    // если периоды не указаны, и текущих нет, тогда без параметров, и всё

    // если текущие есть, тогда только до конца
    // если текущие есть и конец до текущего, тогда не делаем

    // если указано начало, а текущие начало после, тогда с начала до начала
    // если указано начало, а текущие начало до, тогда ничего не делать
    
    let diff: Candle[];

    if (!marketDataEnd) {
      diff = (await MarketDataEngine
        .getCandles({ currency, asset, period, begin, end })).map(e => new Candle(e));
    } else {
      diff = (moment(end).isAfter(marketDataEnd) ? (await MarketDataEngine
        .getCandles({ currency, asset, period, begin: moment(marketDataEnd).add(1, 'm').toDate(), end })) : []).concat(
          moment(begin).isBefore(marketDataBegin) ? (await MarketDataEngine
            .getCandles({ currency, asset, period, begin, end: moment(marketDataBegin).add(-1, 'm').toDate() })) : []
          ).map(e => new Candle(e));
    }
    
    // разбить на два раза, если начало и конец выходит за рамки
    // 
    // если текущих нет, то просто обновить
    // если текущие есть, то есть и то и другое
    // если новое начало меньше текущего
    // const diff = marketData.end ? candles.filter(e => moment(e.time).isAfter(marketData.end)) : candles;
    const { length } = diff;
    // console.log(3, length);

    if (length) {
      const delta: any = {
        end: marketDataEnd ? moment.max(moment(marketDataEnd), moment(diff[diff.length - 1].time)).toDate() : diff[diff.length - 1].time,
        begin: marketDataBegin ? moment.min(moment(marketDataBegin), moment(diff[0].time)).toDate() : diff[0].time
      }
      const db = await connect();
      await db.collection("candle").insertMany(diff.map(e => {
        e.marketDataId = _id;
        return e;
      }));
      await db.collection("marketData").updateOne({ _id }, { $set: delta });
      return 1;
    } else {
      return 0;
    }
  }

  // @Edm.Action
  // async import(@odata.result result: any, @Edm.DateTimeOffset begin?: Date, @Edm.DateTimeOffset end?: Date): Promise<number> {
  //   const db = await connect();
  //   const marketData = await db.collection("marketData").findOne({ _id: this._id });
  //   const { currency, asset, period, _id, begin: currentBegin, end: currentEnd } = marketData;
  //   // TODO запросить только то, что нужно
  //   // дополнить более ранними записями
  //   // дополнить более поздними записями
  //   if (moment(begin).isBefore(currentBegin)) {
      
  //   }
  //   const candles = (await MarketDataEngine
  //     .getCandles({ currency, asset, period, begin, end })).map(e => new Candle(e));
    
  //   const diff = marketData.end ? candles.filter(e => moment(e.time).isAfter(marketData.end)) : candles;
  //   const { length } = diff;
  //   if (length) {
  //     const delta: any = {
  //       end: candles[candles.length - 1].time
  //     };
  //     if (!begin) {
  //       delta.begin = candles[0].time;
  //     }
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

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}

/*
сделать так, чтобы статистика накапливалась в системе, а для этого необходимо добавить рынки
эксперты подключаются к рынкам, следят за появлением новых свечей
у эксперта нельзя просто так поменять символ или период, для этого его нужно связать с другим рынком
точно так же нужно связать с другой стратегией, или поменять параметры стратегии
*/