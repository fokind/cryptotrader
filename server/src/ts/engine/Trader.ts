import { ObjectID } from "mongodb";
import { Trader } from "../models/Trader";
import { odata, ODataQuery } from "odata-v4-server";
import { Ticker } from "../models/Ticker";
import { Portfolio } from "../models/Portfolio";
import { Balance } from "../models/Balance";
const exchange = require('../../../exchange'); // заменить на TS
// import { Ticker } from "./Ticker";

export class TraderEngine {
  // static Traders: Trader[];

  // static async getTraders(@odata.query query: ODataQuery): Promise<Trader[]> {
  //   console.log(query);
  //   return new Promise<Trader[]>(resolve => {
  //     resolve([]);
  //   });
  // }

  // static async getTrader(@odata.key key: string, @odata.query query: ODataQuery): Promise<Trader> {
  //   console.log(key);
  //   return new Promise<Trader>(resolve => {
  //     resolve();
  //   });
  // }
  static async getSymbol({ currency, asset }): Promise<any> {
    return new Promise<any>(resolve => {
      exchange.getSymbol({ currency, asset }, (err, symbol) => {
        resolve(symbol);
      });
    });
  };

  static async getTicker({ currency, asset }): Promise<Ticker> {
    return new Promise<Ticker>(resolve => {
      exchange.getTicker({ currency, asset }, (err, ticker) => {
        resolve(new Ticker(ticker));
      });
    });
  };

  static async getBalance({ currency, asset, user, pass }): Promise<Balance> {
    return new Promise<Balance>(resolve => {
      exchange.getPortfolio({ user, pass }, (err, portfolio: Portfolio[]) => {
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

    // создать ордер
    return new Promise<void>(resolve => {
      exchange.buy({ user, pass, asset, currency, quantity, price }, (err, res) => {
        resolve();
      });
    });
  }

  static async sell({ currency, asset, user, pass }): Promise<void> {
    const { ask: price } = await TraderEngine.getTicker({ currency, asset });
    const { availableAsset: quantity } = await TraderEngine.getBalance({ currency, asset, user, pass });

    // создать ордер
    return new Promise<void>(resolve => {
      exchange.sell({ user, pass, asset, currency, quantity, price }, (err, res) => {
        resolve();
      });
    });
  }

  constructor(jsonData: any) {
    // if (!TraderEngine.Traders) TraderEngine.Traders = [];
    Object.assign(this, jsonData);
  }
}
