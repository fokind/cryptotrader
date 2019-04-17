import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Credential {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public name: string

  @Edm.String
  public value: string

  @Edm.String
  public accountId: ObjectID

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
