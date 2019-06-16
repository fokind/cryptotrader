import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Strategy } from "./Strategy";
import { ExpertEngine } from "../engine/Expert";

export class Expert {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public strategyId: ObjectID

  @Edm.String
  public exchangeKey: string

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public timeframe: string // https://ru.wikipedia.org/wiki/%D0%A2%D0%B0%D0%B9%D0%BC%D1%84%D1%80%D0%B5%D0%B9%D0%BC

  @Edm.EntityType(Edm.ForwardRef(() => Strategy))
  Strategy: Strategy

  @Edm.Function
  @Edm.Int32
  public async getAdvice(@odata.result result: any): Promise<number> {
    return ExpertEngine.getAdvice(result._id);
  }

  // @Edm.Action
  // async start(@odata.result result: any): Promise<void> {
  // }

  // @Edm.Action
  // async stop(@odata.result result: any): Promise<void> {
  // }

  constructor(
    { _id, exchangeKey, currency, asset, timeframe, strategyId }:
    { _id: ObjectID, exchangeKey: string, currency: string, asset: string, timeframe: string, strategyId: ObjectID }
  ) {
    Object.assign(this, { _id, exchangeKey, currency, asset, timeframe, strategyId });
  }
}
