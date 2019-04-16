import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Portfolio } from "./Portfolio";
import { Ticker } from "./Ticker";
import { Expert } from "./Expert";

export class Trader {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public user: string

  @Edm.String
  public pass: string

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public expertId: ObjectID

  @Edm.EntityType(Edm.ForwardRef(() => Ticker))
  public Ticker: Ticker

  @Edm.EntityType(Edm.ForwardRef(() => Expert))
  public Expert: Expert

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Portfolio)))
  public Portfolio: Portfolio[]

  @Edm.Action
  async start(@odata.result result: any): Promise<void> {
  }

  @Edm.Action
  async stop(@odata.result result: any): Promise<void> {
  }

  constructor(jsonData: any) {
    Object.assign(this, jsonData);
  }
}
