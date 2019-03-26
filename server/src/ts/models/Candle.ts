import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";

export class Candle {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public name: string;

  @Edm.DateTimeOffset
  public moment: number;

  @Edm.Double
  public open: number;

  @Edm.Double
  public high: number;

  @Edm.Double
  public low: number;

  @Edm.Double
  public close: number;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
