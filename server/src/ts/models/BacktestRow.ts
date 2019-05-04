import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class BacktestRow {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.DateTimeOffset
  public time: Date;

  @Edm.Double
  public open: number;

  @Edm.Double
  public high: number;

  @Edm.Double
  public low: number;

  @Edm.Double
  public close: number;

  @Edm.Double
  public indicator: number;

  @Edm.Int32
  public advice: number

  @Edm.Double
  public balance: number

  @Edm.Double
  public balanceAsset: number

  @Edm.Double
  public balanceEstimate: number

  @Edm.String
  public backtestId: ObjectID

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}
