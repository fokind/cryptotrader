import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class BacktestRow {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public name: string

  @Edm.String
  public backtestId: ObjectID

  @Edm.String
  public candleId: ObjectID

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}
