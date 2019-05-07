import { ObjectID } from "mongodb";
import { Trader } from "../models/Trader";
// import { Ticker } from "../models/Ticker";
import { Portfolio } from "../models/Portfolio";
// import { Balance } from "../models/Balance";
import connect from "../connect";
import { Expert } from "../models/Expert";
// import { Order } from "../models/Order";
import { ExchangeEngine } from "./Exchange";

export class TraderEngine {
  static async getSymbol({ currency, asset }): Promise<any> {
    return ExchangeEngine.getSymbol({ currency, asset });
  };

  static async getTicker({ currency, asset }): Promise<{ ask: number, bid: number}> {
    return new Promise<{ ask: number, bid: number}>(resolve => {
      ExchangeEngine.getTicker({ currency, asset }).then(({ ask, bid }) => {
        resolve({ ask, bid });
      });
    });
  };

  static async getBalance({ currency, asset, user, pass }): Promise<{ available: number, availableAsset: number }> {
    return new Promise<{ available: number, availableAsset: number }>(resolve => {
      ExchangeEngine.getPortfolio({ user, pass }).then((portfolio: Portfolio[]) => {
        const balance = portfolio.find(e => e.currency === currency);
        const balanceAsset = portfolio.find(e => e.currency === asset);
        resolve({
          available: balance ? balance.available : 0,
          availableAsset: balanceAsset ? balanceAsset.available : 0
        });
      });
    });
  };

  static async buy({ currency, asset, user, pass }): Promise<void> {
    const { quantityIncrement, takeLiquidityRate } = await TraderEngine.getSymbol({ currency, asset });
    const { bid: price } = await TraderEngine.getTicker({ currency, asset });
    const { available } = await TraderEngine.getBalance({ currency, asset, user, pass });
    const quantity = +((Math.floor(available / quantityIncrement / price / (1 + takeLiquidityRate)) * quantityIncrement).toFixed(-Math.log10(quantityIncrement)));
    // console.log({ user, pass, asset, currency, quantity, price });
    return ExchangeEngine.buy({ user, pass, asset, currency, quantity, price });
  }

  static async sell({ currency, asset, market, user, pass }: { currency: string, asset: string, market?: boolean, user: string, pass: string }): Promise<void> {
    let price;
    if (!market) {
      const { ask } = await TraderEngine.getTicker({ currency, asset });
      price = ask;
    }
    
    const { availableAsset: quantity } = await TraderEngine.getBalance({ currency, asset, user, pass });
    return ExchangeEngine.sell({ user, pass, asset, currency, quantity, price });
  }

  static async updateTrader(key: string): Promise<void> {
    // всё как обычный апдейт, только сохраняет в базу данных
    // тогда это метод контроллера
  };

  static async getTrader(key: string): Promise<Trader> {
    const db = await connect();
    const keyId = new ObjectID(key);
    const trader = new Trader(await db.collection("trader").findOne({ _id: keyId }));
    const { currency, asset } = trader;
    const accountId = new ObjectID(trader.accountId);
    const { value: user } = await db.collection("credential").findOne({ accountId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId, name: "SECRET" });

    await new Promise(resolve => { // TODO эти данные сервер может обновлять по расписанию, результат помещать во временное хранилище
      // в активном состоянии обращение будет происходить к кэшу, в неактивном как сейчас
      ExchangeEngine.getOrders({ currency, asset, user, pass }).then((orders: any[]) => {
        trader.hasOrders = !!orders.length;
        if (orders.length) {
          const { orderPrice, orderSide } = orders[0];
          trader.orderPrice = orderPrice;
          trader.orderSide = orderSide;
        }
        resolve();
      });
    });

    await new Promise(resolve => {
      ExchangeEngine.getTicker({ currency, asset }).then((ticker) => {
        const { ask, bid } = ticker;
        trader.ask = ask;
        trader.bid = bid;
        trader.inSpread = trader.hasOrders
          && trader.orderPrice <= ticker.ask
          && trader.orderPrice >= ticker.bid;
        trader.canCancel = !!trader.hasOrders;
        trader.toCancel = trader.canCancel && !trader.inSpread; // TODO если не совпадает направление, то тоже отмена
        resolve();
      });
    });

    await new Promise(resolve => {
      ExchangeEngine.getPortfolio({ user, pass }).then((portfolio: Portfolio[]) => {
        const balance = portfolio.find(e => e.currency === trader.currency);
        const balanceAsset = portfolio.find(e => e.currency === trader.asset);
        trader.available = balance ? balance.available : 0;
        trader.availableAsset = balanceAsset ? balanceAsset.available : 0

        resolve();
      });
    });

    const expert = new Expert(await db.collection("expert").findOne({ _id: trader.expertId }));
    trader.canBuy = !trader.hasOrders && trader.available > 0;
    trader.toBuy = expert.advice === 1;
    trader.canSell = !trader.hasOrders && trader.availableAsset > 0;
    trader.toSell = expert.advice === -1;

    return trader;
  }

  static async getExpert(key: ObjectID): Promise<Expert> {
    const db = await connect();
    return new Expert(await db.collection("expert").findOne({ _id: key }));
  }

  static async update(key: string): Promise<void> {
    const { expertId } = await TraderEngine.getTrader(key); // FIXME дважды выполняется запрос к бирже из-за эксперта
    // чтобы не запрашивать собранного трейдера дважды
    // TODO например, назвать TraderData то, что хранится в базе данных

    const expert = await TraderEngine.getExpert(expertId);
    // если эксперт находится в активном состоянии, то его обновлять не надо
    // если в пассивном, то надо
    await expert.update(expert); // зачем-то каждый раз выполняется обновление, эксперт активируется и обновляется самостоятельно
    // к запущенному эксперту можно обратиться, он без выполнения запроса предоставит нужные данные
    // на запущенного эксперта можно подписаться, он в нужный момент сгенерирует событие

    // эксперта апдейтить не надо, он сам должен апдейтиться

    // есть метод который просто возвращает текущего трейдера
    // есть метод который обновляет текущего трейдера
    // в любом случае трейдер существует и без обновления он меняться не будет
    // трейдер не обязательно хранится в базе данных, хотя наверное сейчас хранится



    const { canCancel, toCancel, canBuy, toBuy, canSell, toSell, asset, currency, accountId } = await TraderEngine.getTrader(key);
    const keyId = new ObjectID(accountId);
    const db = await connect();
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return new Promise<void>(resolve => {
      // здесь 
      if (canCancel && toCancel) {
        ExchangeEngine.cancelOrders({ user, pass, asset, currency }).then(res => {
          resolve();
        });
      } else if (canBuy && toBuy) {
        // можно руководствоваться не только текущим сигналом, но и последним сигналом и текущей ценой в сравнении с ценой на момент сигнала
        TraderEngine.buy({ currency, asset, user, pass }).then(() => {
          resolve();
        });
      } else if (canSell && toSell) {
        // нужно продать может определяться не только исходя из стратегии, но и из текущей цены
        // для этого нужно запоминать, по какой цене была выполнена покупка
        TraderEngine.sell({ currency, asset, user, pass }).then(() => {
          resolve();
        });
      }
      // если можно продать, но нет сигнала продать, то нужен стоп-лосс
      // есть понятие открытой позиции, цена по которой была команда купить
      // есть понятие порога для стоп-лосса, в процентах или абсолютных единицах
      // настраивается в трейдере
      // это является частью тактики
      // стоп-лосс устанавливается на цену, в открытой позиции устанавливается конкретная цена
      // в трейдере есть понятие позиции, есть понятие истории, есть понятие текущего, называется RoundTrip
      // одно из свойств Price, StopPrice
      // в открытой позиции должен быть стоп-лосс
      // тип ордера называется stopLimit
      // прямо в этом ордере задается цена stopPrice
      // создается стоп лимитный ордер на продажу, когда позиция уже открыта
      
      // первое, что нужно сделать, это обеспечить выбор варианта торговли
      // этот или иной
      // другая тактика может содержать произвольный набор параметров, 
      // тактика подключается програмно
      // есть перечисление, которое содержит список доступных тактик
      // нигде в модели это может не храниться, достаточно выбрать из списка
      // по названию будет использована нужная тактика
      // тактика имеет методы
      // движок эти методы абстрагирует
      // тактика как и стратегия должна лишь получать информацию и возвращать решение
      // решениями должны быть команды к бирже (к трейдеру)
      // уровень абстракции должен быть трейдер
      // трейдер должен содержать всю необходимую информацию для тактики
      // трейдер должен иметь все необходимые методы для тактики
      // информация и методы должны быть достаточно абстрактными
      // информация тоже с биржи

      // тактика не должна быть активной?
      // если тактика активна, тогда она не так абстрактна
      // трейдер должен обеспечивать всё многообразие взаимодействий
      // трейдер передает в тактику информацию и получает ответ
      // выполняет, в это время тактика молчит
      // трейдер сам определяет когад в следующий раз нужно запросить тактику
      // может опрашивать тактику каждые несколько милисекунд, или наоборот подождать

    });
  }

  static intervals: any[];

  static start(traderId: string, delay: number) {
    if (!TraderEngine.intervals) TraderEngine.intervals = [];
    TraderEngine.intervals[traderId] = setInterval(() => {
      TraderEngine.update(traderId);
      // по рузельтатам апдейта выполнить действие
    }, delay);
  };

  static stop(traderId: string) {
    if (TraderEngine.intervals) {
      const interval = TraderEngine.intervals[traderId];
      if (interval) clearInterval(interval);
    }
  };
}
