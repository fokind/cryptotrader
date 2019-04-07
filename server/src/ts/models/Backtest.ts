import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { BacktestRow } from "./BacktestRow";

import connect from "../connect";

const tulind = require('tulind');
const async = require('async');

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
    const db = await connect();
    // получить бэктест из базы данных

    const backtestId = result._id;
    const strategyId = result.strategyId;
    const candles = await db.collection("candle").find({}).sort({ time: 1 }).toArray();

    // подключить стратегию
    // предварительно узнать идентификатор стратегии
    // можно брать из селекта, но неправильно, т.к. понадобятся и другие свойства, не обязательно относящиеся к UI
    const strategy = await db.collection("strategy").findOne({ _id: strategyId });
    const strategyFunction = new Function(
      'candles, tulind, callback',
      strategy.code,
    );
    // использовать при расчете

    const balanceInitial = 1000;

    async.map(candles,
      (candle, cb) => strategyFunction(candles.slice(0, candles.indexOf(candle) + 1), tulind, cb),
      (err, results) => {
        const backtestRows = [];
        for (let i = 0; i < candles.length; i++) {
          const advice = results[i];
          const candle = candles[i];
          const price = candle.close;
          const prev = i > 0 ? backtestRows[i - 1] : null;
          let balanceFrom = i > 0 ? prev.balanceFrom : balanceInitial;
          let balanceTo = i > 0 ? prev.balanceTo : 0;
  
          if (advice === 1) {
            balanceFrom = 0;
            balanceTo += prev.balanceFrom / price;
          } else if (advice === -1) {
            balanceFrom += prev.balanceTo * price;
            balanceTo = 0;
          }
  
          backtestRows.push(Object.assign({
            backtestId,
            advice,
            balanceFrom,
            balanceTo,
            balanceEstimate: balanceFrom + balanceTo * price,
          }, candle));
        }
  
        db.collection("backtestRow", null, (err, backtestRowCollection) => {
          backtestRowCollection.insertMany(backtestRows);
        });
      }
    );
  }

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}
