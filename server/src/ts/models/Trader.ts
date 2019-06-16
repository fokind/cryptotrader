import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Expert } from "./Expert";
import connect from "../connect";
import { TraderEngine } from "../engine/Trader";
import { Account } from "./Account";
import { ExchangeEngine } from "../engine/Exchange";
import { ExpertEngine } from "../engine/Expert";

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

  @Edm.Double
  public stoplossLimit: number // доля от цены открытия, на которую рыночная цена может упасть

  @Edm.Double
  public stoplossPrice: number

  @Edm.Int32
  public positionMode: number // принимает значения только long или short

  @Edm.Boolean
  public stoplossEnabled: boolean

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

  @Edm.Double
  public ask: number;

  @Edm.Double
  public bid: number;

  @Edm.Double
  public available: number;

  @Edm.Double
  public availableAsset: number;


  @Edm.EntityType(Edm.ForwardRef(() => Expert))
  public Expert: Expert

  @Edm.EntityType(Edm.ForwardRef(() => Account))
  public Account: Account

  @Edm.Double
  public orderPrice: number;

  @Edm.String
  public orderSide: string;

  @Edm.Action
  async update(@odata.result result: any): Promise<number> {
    const { _id } = this;
    // console.log(this);
    // const trader = await TraderEngine.getTrader(_id.toHexString());
    // проапдейтить из биржи
    // выполнить вычисления
    // сохранить
    // модель действительно должна уметь это делать?
    // после апдейта можно выполнять действия
    // рекомендации уже получены здесь

    const db = await connect();
    // const keyId = _id;
    const trader = new Trader(await db.collection("trader").findOne({ _id }));
    // console.log(trader);
    const { currency, asset, accountId } = trader;
    const { value: user } = await db.collection("credential").findOne({ accountId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId, name: "SECRET" });

    const orders = await ExchangeEngine.getOrders({ currency, asset, user, pass });
    // console.log(orders);
    trader.hasOrders = !!orders.length;
    if (orders.length) {
      const { price: orderPrice } = orders[0];
      trader.orderPrice = orderPrice;
    }

    const ticker = await ExchangeEngine.getTicker({ currency, asset });
    // console.log(ticker);
    const { ask, bid } = ticker;
    trader.ask = ask;
    trader.bid = bid;
    trader.inSpread = trader.hasOrders
      && trader.orderPrice <= ticker.ask
      && trader.orderPrice >= ticker.bid;
    trader.canCancel = !!trader.hasOrders;
    trader.toCancel = trader.canCancel && !trader.inSpread; // TODO если не совпадает направление, то тоже отмена
    
    const portfolio = await ExchangeEngine.getPortfolio({ user, pass });
    // console.log(portfolio);
    const balance = portfolio.find(e => e.currency === trader.currency);
    const balanceAsset = portfolio.find(e => e.currency === trader.asset);
    trader.available = balance ? balance.available : 0;
    trader.availableAsset = balanceAsset ? balanceAsset.available : 0

    const advice = await ExpertEngine.getAdvice(trader.expertId);
    
    trader.canBuy = !trader.hasOrders && trader.available > 0;
    const prevToBuy = trader.toBuy;

    if (advice !== 0) {
      trader.toBuy = advice === 1;
      trader.toSell = advice === -1;
    }

    trader.canSell = !trader.hasOrders && trader.availableAsset > 0;

    // если ни то ни другое, то не меняется
    // если режим стоп-лосс, и цена ниже предельной, тогда short
    // если toBuy, а предыдущий нет
    if (trader.stoplossEnabled) {
      if (!prevToBuy && advice === 1) trader.stoplossPrice = ((ask + bid) / 2) * (1 - trader.stoplossLimit); // UNDONE улучшить определение цены
      if (bid <= trader.stoplossPrice) {
        trader.toBuy = false;
        trader.toSell = true;
      }
      // if (trader.positionMode && trader.bid < trader.stoplossPrice)
    }

    // лонг если последний совет был купить
    // шот если продать
    // если сработал стоп-лосс - то продать
    // купить или продать - это то же самое что шот и лонг? разницы не нахожу вообще
    // одно понятно, что есть момент изменения сигнала и его нужно обрабатывать независимо

    // positionMode
    // stoploss...

    // короче режим лонг открывается в момент поступления сигнала
    // закрывается в момент другого сигнала или стопа

    // console.log(trader);
    return db.collection("trader").updateOne({ _id }, { $set: trader }).then(result => result.modifiedCount);
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
  async sell(@odata.result result: any, market?: boolean): Promise<void> {
    const { _id } = this;
    const db = await connect();
    const { currency, asset, accountId } = new Trader(await db.collection("trader").findOne({ _id }));
    const keyId = new ObjectID(accountId);
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return TraderEngine.sell({ currency, asset, market, user, pass });
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