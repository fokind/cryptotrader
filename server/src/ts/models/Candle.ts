import { Edm } from "odata-v4-server";
import { ObjectID } from "mongodb";
import { ICandle } from "../engine/Exchange";

export class Candle implements ICandle {
  @Edm.String
  public time: string;

  @Edm.Double
  public open: number;

  @Edm.Double
  public high: number;

  @Edm.Double
  public low: number;

  @Edm.Double
  public close: number;

  // @Edm.String
  // public historyId: ObjectID; // UNDONE удалить

  // @Edm.String
  // public marketDataId: ObjectID; // UNDONE удалить

  // constructor(jsonData: any) {
  //   Object.assign(this, jsonData);
  // }

  // UNDONE заменить на это:
  constructor({ time, open, high, low, close }: ICandle) {
    Object.assign(this, { time, open, high, low, close });
  }
}
