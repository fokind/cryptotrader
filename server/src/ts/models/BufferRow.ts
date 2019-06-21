import { Edm } from "odata-v4-server";
import { ICandle } from "../engine/Exchange";

export class BufferRow implements ICandle {
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

  @Edm.Collection(Edm.Double)
  public values: number[];

  constructor(data) {
    Object.assign(this, data);
  }
}
