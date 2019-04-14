import { Edm } from "odata-v4-server";
import { ObjectID } from "mongodb";

export class Candle {
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
  public historyId: ObjectID;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
