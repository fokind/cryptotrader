import { Edm } from "odata-v4-server";

export class Ticker {
  @Edm.Double
  public ask: number;

  @Edm.Double
  public bid: number;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
