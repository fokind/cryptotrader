import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Candle } from "./Candle";

export class BacktestRow {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.Int32
  public advice: number

  @Edm.Double
  public balanceFrom: number

  @Edm.Double
  public balanceTo: number

  @Edm.Double
  public balanceEstimate: number

  @Edm.String
  public backtestId: ObjectID

  @Edm.String
  public candleId: ObjectID

  @Edm.ForeignKey("candleId")
  @Edm.EntityType(Edm.ForwardRef(() => Candle))
  Candle: Candle

  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }
}
