import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { BacktestRow } from "./BacktestRow";

import connect from "../connect";

export class Backtest {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public name: string

  @Edm.String
  public strategyId: ObjectID

  @Edm.ForeignKey("backtestId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BacktestRow)))
  Rows: BacktestRow[]

  @Edm.Action
  async update(@odata.result result: Backtest) {
    const backtestId = (typeof result._id === "string") ? new ObjectID(result._id) : result._id;
    const db = await connect();
    const candles = await db.collection("candle").find({}, {
      limit: 10,
      sort: { moment: 1 }
    }).toArray();

    const backtestRows = candles.map(candle => {
      return {
        backtestId,
        candleId: (typeof candle._id === "string") ? new ObjectID(candle._id) : candle._id,
        advice: 0, // применить стратегию
        balanceFrom: 0,
        balanceTo: 0,
        balanceEstimate: 0,
      }
    });
    const backtestRowCollection = await db.collection("backtestRow");
    backtestRowCollection.insertMany(backtestRows);
  }

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}
