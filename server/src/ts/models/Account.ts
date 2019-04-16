import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Credential } from "./Credential";

export class Account {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public name: string

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Credential)))
  public Credentials: Credential[]

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
