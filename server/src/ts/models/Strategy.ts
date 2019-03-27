import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Strategy {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public name: string;

  @Edm.String
  public code: string;

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
