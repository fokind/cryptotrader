import { ObjectID } from "mongodb";
import { Trader } from "../models/Trader";
import { Ticker } from "../models/Ticker";
import { Portfolio } from "../models/Portfolio";
import { Balance } from "../models/Balance";
import connect from "../connect";
import { Expert } from "../models/Expert";
import { Order } from "../models/Order";
import { ExchangeEngine } from "./Exchange";

export class TraderEngine {
  static async getSymbol({ currency, asset }): Promise<any> {
    return ExchangeEngine.getSymbol({ currency, asset });
  };

  static async getTicker({ currency, asset }): Promise<Ticker> {
    return new Promise<Ticker>(resolve => {
      ExchangeEngine.getTicker({ currency, asset }).then(({ ask, bid }) => {
        resolve(new Ticker({ ask, bid, currency, asset }));
      });
    });
  };

  static async getBalance({ currency, asset, user, pass }): Promise<Balance> {
    return new Promise<Balance>(resolve => {
      ExchangeEngine.getPortfolio({ user, pass }).then((portfolio: Portfolio[]) => {
        const balance = portfolio.find(e => e.currency === currency);
        const balanceAsset = portfolio.find(e => e.currency === asset);
        resolve(new Balance({
          available: balance ? balance.available : 0,
          availableAsset: balanceAsset ? balanceAsset.available : 0
        }));
      });
    });
  };

  static async buy({ currency, asset, user, pass }): Promise<void> {
    const { quantityIncrement, takeLiquidityRate } = await TraderEngine.getSymbol({ currency, asset });
    const { bid: price } = await TraderEngine.getTicker({ currency, asset });
    const { available } = await TraderEngine.getBalance({ currency, asset, user, pass });
    const quantity = +((Math.floor(available / quantityIncrement / price / (1 + takeLiquidityRate)) * quantityIncrement).toFixed(-Math.log10(quantityIncrement)));
    return ExchangeEngine.buy({ user, pass, asset, currency, quantity, price });
  }

  static async sell({ currency, asset, user, pass }): Promise<void> {
    const { ask: price } = await TraderEngine.getTicker({ currency, asset });
    const { availableAsset: quantity } = await TraderEngine.getBalance({ currency, asset, user, pass });
    return ExchangeEngine.sell({ user, pass, asset, currency, quantity, price });
  }

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
          trader.Order = new Order(orders[0]);
        } else {
          delete trader.Order;
        }
        resolve();
      });
    });

    await new Promise(resolve => {
      ExchangeEngine.getTicker({ currency, asset }).then((ticker) => {
        trader.Ticker = new Ticker(ticker);
        trader.inSpread = trader.hasOrders
          && trader.Order.price <= ticker.ask
          && trader.Order.price >= ticker.bid;
        trader.canCancel = !!trader.hasOrders;
        trader.toCancel = trader.canCancel && !trader.inSpread; // TODO если не совпадает направление, то тоже отмена
        resolve();
      });
    });

    await new Promise(resolve => {
      ExchangeEngine.getPortfolio({ user, pass }).then((portfolio: Portfolio[]) => {
        const balance = portfolio.find(e => e.currency === trader.currency);
        const balanceAsset = portfolio.find(e => e.currency === trader.asset);
        trader.Balance = new Balance({
          available: balance ? balance.available : 0,
          availableAsset: balanceAsset ? balanceAsset.available : 0
        });
        resolve();
      });
    });

    const expert = new Expert(await db.collection("expert").findOne({ _id: trader.expertId }));
    trader.canBuy = !trader.hasOrders && trader.Balance.available > 0;
    trader.toBuy = expert.advice === 1;
    trader.canSell = !trader.hasOrders && trader.Balance.availableAsset > 0;
    trader.toSell = expert.advice === -1;

    return trader;
  }

  static async getExpert(key: ObjectID): Promise<Expert> {
    const db = await connect();
    return new Expert(await db.collection("expert").findOne({ _id: key }));
  }

  static async update(key: string): Promise<void> {
    const { expertId } = await TraderEngine.getTrader(key);
    // чтобы не запрашивать собранного трейдера дважды
    // TODO например, назвать TraderCore то, что хранится в базе данных

    const expert = await TraderEngine.getExpert(expertId);
    await expert.update(expert);
    const { canCancel, toCancel, canBuy, toBuy, canSell, toSell, asset, currency, accountId } = await TraderEngine.getTrader(key);
    const keyId = new ObjectID(accountId);
    const db = await connect();
    const { value: user } = await db.collection("credential").findOne({ accountId: keyId, name: "API" });
    const { value: pass } = await db.collection("credential").findOne({ accountId: keyId, name: "SECRET" });
    return new Promise<void>(resolve => {
      if (canCancel && toCancel) {
        ExchangeEngine.cancelOrders({ user, pass, asset, currency }).then(res => {
          resolve();
        });
      } else if (canBuy && toBuy) {
        TraderEngine.buy({ currency, asset, user, pass }).then(() => {
          resolve();
        });
      } else if (canSell && toSell) {
        TraderEngine.sell({ currency, asset, user, pass }).then(() => {
          resolve();
        });
      }
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
    clearInterval(TraderEngine.intervals[traderId]);
  };
}
