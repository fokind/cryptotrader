import { Edm } from "odata-v4-server";

export class Portfolio {
  @Edm.Key
  @Edm.String
  public currency: string;

  @Edm.Double
  public available: number;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
