import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Backtest } from "./Backtest";

@Edm.Annotate({
  term: "UI.DisplayName",
  string: "BacktestItems"
})
export class BacktestItem {
  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }

  @Edm.Key
  @Edm.Computed
  @Edm.String
  _id: ObjectID

  @Edm.String
  name: string

  @Edm.ForeignKey("backtestId")
  @Edm.EntityType(Edm.ForwardRef(() => Backtest))
  Backtest: Backtest
}
