import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
// import { BacktestItem } from "./BacktestItem";

// @Edm.Annotate({
//   term: "UI.DisplayName",
//   string: "Backtests"
// })
export class Backtest {
  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }

  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public name: string

  @Edm.String
  public strategyId: ObjectID

  // @Edm.ForeignKey("backtestId")
  // @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BacktestItem)))
  // Items: BacktestItem[]
}
