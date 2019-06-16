import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Backtest } from "./Backtest";

export class Strategy {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public name: string;

  @Edm.Int32
  public warmup: number;

  @Edm.String
  public code: string;

  @Edm.String
  public indicatorKey: string // cci

  @Edm.String
  public indicatorOptions: string // массив в тексте

  // @Edm.Int32
  // public version: number;

  // @Edm.ForeignKey("strategyId")
  // @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Indicator)))
  // public Indicators: Indicator[]

  @Edm.ForeignKey("strategyId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Backtest)))
  public Backtests: Backtest[]

  constructor(
    { _id, name, warmup, code, indicatorKey, indicatorOptions }:
    { _id: ObjectID, name: string, warmup: number, code: string, indicatorKey: string, indicatorOptions: string }
  ) {
    Object.assign(this, { _id, name, warmup, code, indicatorKey, indicatorOptions });
  }
}

// Creator
// description
// recommended exchanges
// Best with // Pairs
// Parameters
// interval
// threshholds
// low 40
// high 60
// margin ...
// Best frequencies
// Historical performance, time
// Perfomance, trades
// Market
// Create bot()
// requency
// risk

// Backtest
// exchange
// market
// market (%)
// performance (%)
// duration
// from
// to
// trades
// result
// start balance
// final balance
// market
// profit
// initial price
// final price

// roundtrips
// buy
// time
// price
// sell
// time
// price
// p&l $
// Profit %

// edit, lock
// version
// backtest, version