import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Ticker } from "./Ticker";
import { Balance } from "./Balance";
import { Expert } from "./Expert";
import { Order } from "./Order";
import connect from "../connect";
import { TraderEngine } from "../engine/Trader";
import { Account } from "./Account";
import { ExchangeEngine } from "../engine/Exchange";

export class Trader {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.Double
  public buyQuantity: number

  @Edm.Boolean
  public active: boolean

  @Edm.Boolean
  public hasOrders: boolean

  @Edm.Boolean
  public inSpread: boolean

  @Edm.Boolean
  public toCancel: boolean

  @Edm.Boolean
  public toSell: boolean

  @Edm.Boolean
  public toBuy: boolean

  @Edm.Boolean
  public canCancel: boolean

  @Edm.Boolean
  public canSell: boolean

  @Edm.Boolean
  public canBuy: boolean

  @Edm.String
  public expertId: ObjectID

  @Edm.String
  public accountId: ObjectID

  @Edm.ComplexType(Edm.ForwardRef(() => Ticker))
  public Ticker: Ticker

  @Edm.ComplexType(Edm.ForwardRef(() => Balance))
  public Balance: Balance

  @Edm.EntityType(Edm.ForwardRef(() => Expert))
  public Expert: Expert

  @Edm.EntityType(Edm.ForwardRef(() => Account))
  public Account: Account

  @Edm.ComplexType(Edm.ForwardRef(() => Order))
  public Order: Order // не нашел возможности пользоваться асинхронными свойствами

  // TODO разобраться как использовать
  // @Edm.Function
  // public async getTicker(@odata.result result: any): Promise<Ticker> {
  //   return await new Promise<Ticker>(resolve => {
  //     exchange.getTicker(result, (err, ticker) => {
  //       resolve(new Ticker(ticker));
  //     });
  //   });
  // }

  @Edm.Action
  async update(@odata.result result: any): Promise<number> {
    const { _id } = this;
    const db = await connect();
    const { expertId } = await db.collection("trader").findOne({ _id });
    const expert = new Expert(await db.collection("expert").findOne({ _id: expertId }));
    return expert.update(expert);
  }

  @Edm.Action
  async buy(@odata.result result: any): Promise<void> {
    const { _id } = this;
    const db = await connect();
    const { currency, asset, accountId } = new Trader(await db.collection("trader").findOne({ _id }));
    const keyId = new ObjectID(accountId);
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return TraderEngine.buy({ currency, asset, user, pass });
  }

  @Edm.Action
  async sell(@odata.result result: any): Promise<void> {
    const { _id } = this;
    const db = await connect();
    const { currency, asset, accountId } = new Trader(await db.collection("trader").findOne({ _id }));
    const keyId = new ObjectID(accountId);
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return TraderEngine.sell({ currency, asset, user, pass });
  }

  @Edm.Action
  async cancel(@odata.result result: any): Promise<void> {
    const { _id } = this;
    const db = await connect();
    const { currency, asset, accountId } = new Trader(await db.collection("trader").findOne({ _id }));
    const keyId = new ObjectID(accountId);
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return new Promise(resolve => {
      ExchangeEngine.cancelOrders({ user, pass, asset, currency }).then(res => {
        resolve(res);
      });
    });
  }

  @Edm.Action
  async start(@odata.result result: any): Promise<void> {
    const trader = this;
    trader.active = true;
    const db = await connect();
    await db.collection("trader").updateOne({ _id: trader._id }, { $set: { active: true } });
    TraderEngine.start(trader._id.toHexString(), 3000);
  }

  @Edm.Action
  async stop(@odata.result result: any): Promise<void> {
    const trader = this;
    trader.active = false;
    const db = await connect();
    await db.collection("trader").updateOne({ _id: trader._id }, { $set: { active: false } });
    TraderEngine.stop(trader._id.toHexString());
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

состояние должно влиять на кнопки
купить или продать можно только если есть достаточная сумма баланса
отменить можно только если ордер в принципе есть
*/