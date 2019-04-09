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

  @Edm.DateTimeOffset
  public time: Date;

  @Edm.DateTimeOffset
  public timeFrom: Date;

  @Edm.DateTimeOffset
  public timeTo: Date;

  @Edm.String
  public symbolFrom: string

  @Edm.String
  public symbolTo: string

  @Edm.String
  public period: string // подумать заменить на frequency

  // @Edm.Int32
  // public length: number // упразднить

  @Edm.Int32
  public trades: number

  @Edm.Double
  public balanceInitial: number // подумать заменить на balanceStart

  // @Edm.Double
  // public balanceEstimate: number // подумать заменить на balanceFinal

  @Edm.Double
  public priceInitial: number

  @Edm.Double
  public priceFinal: number

  @Edm.Double
  public priceChange: number

  // @Edm.Double
  // public balanceStart: number

  @Edm.Double
  public balanceFinal: number

  @Edm.Double
  public balanceChange: number

  // @Edm.Double
  // public profit: number // можно вычислением

  // @Edm.Double
  // public result: number // упразднить

  @Edm.String
  public strategyId: ObjectID

  @Edm.ForeignKey("backtestId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BacktestRow)))
  Rows: BacktestRow[]

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}

// start time
// end time
// timespan
// start price
// end price
// market
// amount of trades
// start balance
// final balance
// simulated profit

// "trades": [
//   {
//       "id": "trade-1",
//       "adviceId": "advice-1", // backtestRowId
//       "action": "buy",
//       "cost": 0.30000000000000027, // нет
//       "amount": 1.01420229,
//       "price": 7019.99,
//       "portfolio": { // balance
//           "asset": 1.08661475,
//           "currency": 0
//       },
//       "balance": 7119.6899337771, // estimate
//       "date": 1522685280 // time
//   },
//   // and more
// ]
