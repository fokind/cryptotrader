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

  @Edm.String
  public code: string;

  @Edm.ForeignKey("strategyId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Backtest)))
  Backtests: Backtest[]

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
