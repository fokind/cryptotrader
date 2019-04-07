import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Candle {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public name: string;

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

  @Edm.String
  public historyId: ObjectID

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
