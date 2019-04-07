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
    const strategyId = (typeof result.strategyId === "string") ? new ObjectID(result.strategyId) : result.strategyId;
    const db = await connect();
    const candles = await db.collection("candle").find({}, {
      limit: 10,
      sort: { moment: 1 }
    }).toArray();

    // подключить стратегию
    // предварительно узнать идентификатор стратегии
    // можно брать из селекта, но неправильно, т.к. понадобятся и другие свойства, не обязательно относящиеся к UI
    const strategy = await db.collection("candle").findOne({ _id: strategyId });
    console.log(strategy);

    // использовать при расчете

    const balanceInitial = 1;

    const backtestRows = candles.map((candle, index, array) => {
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
