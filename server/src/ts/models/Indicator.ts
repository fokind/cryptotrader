import { Edm } from "odata-v4-server";
// import { IndicatorOption } from "./IndicatorOption";
import { ObjectID } from "mongodb";

export class Indicator {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID;

  @Edm.String
  public key: string;

  // @Edm.String
  // public strategyId: ObjectID

  @Edm.String
  public bufferId: ObjectID;

  // @Edm.ForeignKey("indicatorId")
  // @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => IndicatorOption)))
  // public Options: IndicatorOption[]

  @Edm.String
  public options: string;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
