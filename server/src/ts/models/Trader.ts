import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Ticker } from "./Ticker";
import { Balance } from "./Balance";
import { Expert } from "./Expert";
import { Order } from "./Order";

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

  @Edm.EntityType(Edm.ForwardRef(() => Balance))
  public Balance: Balance

  @Edm.EntityType(Edm.ForwardRef(() => Expert))
  public Expert: Expert

  @Edm.EntityType(Edm.ForwardRef(() => Order))
  public Orders: Order[]

  @Edm.ComplexType(Edm.ForwardRef(() => Order))
  public Order: Order // не нашел возможности пользоваться асинхронными свойствами

  // TODO разобраться как использовать
  // @Edm.Function
  // public async getTicker(@odata.result result: any): Promise<Ticker> {
  //   console.log(result);
  //   return await new Promise<Ticker>(resolve => {
  //     exchange.getTicker(result, (err, ticker) => {
  //       resolve(new Ticker(ticker));
  //     });
  //   });
  // }

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
