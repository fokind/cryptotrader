import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Exchange {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public name: string;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
