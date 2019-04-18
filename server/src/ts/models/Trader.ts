import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Ticker } from "./Ticker";
import { Balance } from "./Balance";
import { Expert } from "./Expert";
import { Order } from "./Order";
import connect from "../connect";

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

  @Edm.Boolean
  public hasOrders: boolean

  @Edm.Boolean
  public isOrderInSpread: boolean

  @Edm.String
  public expertId: ObjectID

  @Edm.ComplexType(Edm.ForwardRef(() => Ticker))
  public Ticker: Ticker

  @Edm.ComplexType(Edm.ForwardRef(() => Balance))
  public Balance: Balance

  @Edm.EntityType(Edm.ForwardRef(() => Expert))
  public Expert: Expert

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
  async update(@odata.result result: any): Promise<number> {
    const { expertId } = this;
    const db = await connect();
    const expert = new Expert(await db.collection("expert").findOne({ _id: expertId }));
    return await expert.update(expert);
  }

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

/*
есть движок, это класс, он статический
через него доступен метод getInstance, который возвращает экземпляр соответствующий модели
к этому движку, вероятно, обращается контроллер
при получении списка трейдеров обновления данных не выполняется
при адресном обращении при запроси может быть затребована актуализация
у каждого самостоятельного свойства есть момент последнего обновления
инстанс обменивается данными с апи и хранит поселднюю полученную информацию
есть метод или параметр, который говорит, что данные перед получением нужно обновить
эксперт обновляется отдельно, но запрашиваются данные у него могут часто
модель никакого состояния не хранит
эксперт каждый раз не обращается в базу данных за набором данных
эксперт считывает и хранит только необходимый набор для получения сигнала
при актуализации данных с экспертом сравнивается момент последнего обновления, если не совпал, то обновляется
в активном режиме и эксперт и маркет и все остальные работают самостоятельно, в нужные моменты синхронизируются
*/