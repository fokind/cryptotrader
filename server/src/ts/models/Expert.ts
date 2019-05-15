import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Strategy } from "./Strategy";
import { MarketData } from "./MarketData";

import connect from "../connect";
import { ExpertEngine } from "../engine/Expert";
import { Indicator } from "./Indicator";
import { Candle } from "./Candle";

export class Expert {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  // @Edm.String
  // public currency: string

  // @Edm.String
  // public asset: string

  // @Edm.String
  // public period: string

  @Edm.Int32
  public advice: number

  @Edm.Double
  public lastCLose: number

  @Edm.Int32
  public delay: number

  @Edm.Boolean
  public active: boolean

  @Edm.String
  public strategyId: ObjectID

  @Edm.String
  public marketDataId: ObjectID

  @Edm.DateTimeOffset
  public lastUpdate: Date;

  @Edm.EntityType(Edm.ForwardRef(() => Strategy))
  Strategy: Strategy

  @Edm.EntityType(Edm.ForwardRef(() => MarketData))
  MarketData: MarketData

  @Edm.Action
  async update(@odata.result result: any): Promise<number> {
    // запросить из кэша, кэш либо устаревает, либо обновляется в автоматическом режиме
    // если кэш устарел, тогда проделать обновление
    
    const expert = this;
    // console.log(expert);
    const { marketDataId, _id, strategyId, lastUpdate } = this;

    const db = await connect();
    const marketData = new MarketData(await db.collection("marketData").findOne({ _id: marketDataId }));
    if (await marketData.update(marketData) || lastUpdate !== marketData.end) {
      const candles = await db.collection("candle").find({ marketDataId })
        .sort({ time: -1 }).limit(29).map(e => new Candle(e)).toArray(); // свечи отранжированы?
      // console.log(candles);
      // UNDONE 28 заменить на параметр из стратегии warmupPeriod

      // в бэктест добавить индикатор
      // нужно только заданное число свечей
      // они должны быть по возрастанию
      const { code } = await db.collection("strategy").findOne({ _id: strategyId });
      // console.log(code);
      const indicators = await db.collection("indicator").find({ strategyId }).map(e => new Indicator(e)).toArray();

      // console.log(indicators);
      // FIXME  здесь вычисленные индикаторы?
      const strategyFunction = new Function(
        'reversedIndicators',
        code,
      );

      // const strategyFunction = new Function('candles, tulind, callback', code);
      // TODO как в бэктесте, отдельно вычислить индикатор по параметрам для функции, туда передать
      // для начала можно один индикатор с одним параметром, все жестко заданные
      // количество точек для стратегии это тоже индикатор

      const advice = await ExpertEngine.calculateAdvice({ candles, strategyFunction, indicators });

      return await new Promise<number>(resolve => {
        // свечи отранжированы?
        // strategyFunction(candles, tulind, (err, advice) => {
        if (lastUpdate !== marketData.end || expert.advice !== advice) {
          const delta = { advice, lastUpdate: marketData.end, lastCLose: candles[candles.length - 1].close };
          // console.log(delta);
          db.collection("expert").updateOne({ _id }, { $set: delta }).then(result => {
            Object.assign(expert, delta);
            resolve(result.modifiedCount);
          });
        } else {
          resolve(0);
        }
        // });
      });
    } else {
      return 0;
    }
  }

  @Edm.Action
  async start(@odata.result result: any): Promise<void> {
  }

  @Edm.Action
  async stop(@odata.result result: any): Promise<void> {
  }

  constructor(jsonData: any) {
    this.active = false;
    this.delay = 60000; // должна зависеть от периода
    this.advice = 0;
    Object.assign(this, jsonData);
  }
}
