import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Strategy } from "./Strategy";
import { MarketData } from "./MarketData";

const tulind = require('tulind');
import connect from "../connect";

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
    const { marketDataId, _id, strategyId, lastUpdate } = this;

    const db = await connect();
    const marketData = new MarketData(await db.collection("marketData").findOne({ _id: marketDataId }));
    if (await marketData.update(marketData) || lastUpdate !== marketData.end) {
      const candles = await db.collection("candle").find({ marketDataId }).toArray();
      const { code } = await db.collection("strategy").findOne({ _id: strategyId });
      const strategyFunction = new Function('candles, tulind, callback', code);

      return await new Promise<number>(resolve => {
        strategyFunction(candles, tulind, (err, advice) => {
          if (lastUpdate !== marketData.end || expert.advice !== advice) {
            const delta = { advice, lastUpdate: marketData.end };
            db.collection("expert").updateOne({ _id }, { $set: delta }).then(result => {
              Object.assign(expert, delta);
              resolve(result.modifiedCount);
            });
          }
          resolve(0);
        });
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
