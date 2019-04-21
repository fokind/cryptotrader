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

  // @Edm.String
  // public accountId: ObjectID
  // здесь требуется только API_KEY

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[]

  @Edm.Action
  async update(@odata.result result: any, @Edm.DateTimeOffset begin?: Date, @Edm.DateTimeOffset end?: Date): Promise<number> {
    const marketData = this;
    const { currency, asset, period, _id } = this;
    const candles = (await MarketDataEngine
      .getCandles({ currency, asset, period, begin, end })).map(e => new Candle(e));
    
    const diff = marketData.end ? candles.filter(e => moment(e.time).isAfter(marketData.end)) : candles;
    const { length } = diff;
    if (length) {
      const delta: any = {
        end: candles[candles.length - 1].time
      };
      if (!begin) {
        delta.begin = candles[0].time;
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