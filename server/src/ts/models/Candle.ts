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
  public moment: number;

  @Edm.Decimal
  public open: number;

  @Edm.Decimal
  public high: number;

  @Edm.Decimal
  public low: number;

  @Edm.Decimal
  public close: number;

  @Edm.String
  public historyId: ObjectID

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
