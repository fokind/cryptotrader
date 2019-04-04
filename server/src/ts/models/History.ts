import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Candle } from "./Candle";

export class History {
  constructor (jsonData: any) {
    Object.assign(this, jsonData);
  }

  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public symbolFrom: string

  @Edm.String
  public symbolTo: string

  @Edm.String
  public period: string

  @Edm.ForeignKey("historyId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[]

  // @Edm.Action
  // public update: Function

  // @Edm.Action
  // getUnitPrice(@odata.result result: History) {
  //     console.log(result._id);
  // }
}
