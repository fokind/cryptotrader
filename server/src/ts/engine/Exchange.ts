import { Order } from '../models/Order';
import { Hitbtc } from '../exchanges/hitbtc';
import { Cryptocompare } from '../exchanges/cryptocompare';

const exchanges = {
  hitbtc: new Hitbtc(),
  cryptocompare: new Cryptocompare(),
};

export enum SideEnum {
  sell,
  buy
};

// export enum IntervalEnum {
//   "M1",
//   "H1",
//   "D1"
// };

export interface IExchange {
  createOrder(options: {
    currency: string,
    asset: string,
    side: SideEnum,
    quantity: number,
    price: number,
    user: string,
    pass: string
  }): Promise<void>;

  getOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<Array<Order>>;

  cancelOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<void>;

  getSymbol(options: {
    currency: string,
    asset: string,
  }): Promise<{ quantityIncrement: number, takeLiquidityRate: number }>;

  getTicker(options: {
    currency: string,
    asset: string,
  }): Promise<{ ask: number, bid: number }>;
  
  getPortfolio(options: {
    user: string,
    pass: string,
  }): Promise<Array<{ currency: string, available: number }>>;
};

export interface IMarketDataSource {
  getCandles(options: {
    currency: string,
    asset: string,
    period: string,
    begin?: Date,
    end?: Date
  }): Promise<Array<{
    time: Date,
    open: number,
    high: number,
    low: number,
    close: number
  }>>;
};

export class ExchangeEngine {
  static async getOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<Array<Order>> {
    return exchanges.hitbtc.getOrders(options);
  };

  static async cancelOrders(options: {
    currency: string,
    asset: string,
    user: string,
    pass: string
  }): Promise<void> {
    return exchanges.hitbtc.cancelOrders(options);
  };

  static async buy(options: {
    currency: string,
    asset: string,
    quantity: number,
    price: number,
    user: string,
    pass: string
  }): Promise<void> {
    const { user, pass, asset, currency, quantity, price } = options;
    return exchanges.hitbtc.createOrder({ user, pass, asset, currency, quantity, price, side: SideEnum.buy });
  };

  static async sell(options: {
    currency: string,
    asset: string,
    quantity: number,
    price: number,
    user: string,
    pass: string
  }): Promise<void> {
    const { user, pass, asset, currency, quantity, price } = options;
    return exchanges.hitbtc.createOrder({ user, pass, asset, currency, quantity, price, side: SideEnum.sell });
  };

  static async getSymbol(options: {
    currency: string,
    asset: string,
  }): Promise<{ quantityIncrement: number, takeLiquidityRate: number }> {
    return exchanges.hitbtc.getSymbol(options);
  };

  static async getTicker(options: {
    currency: string,
    asset: string,
  }): Promise<{ ask: number, bid: number }> {
    return exchanges.hitbtc.getTicker(options);
  };
  
  static async getPortfolio(options: {
    user: string,
    pass: string,
  }): Promise<Array<{ currency: string, available: number }>> {
    return exchanges.hitbtc.getPortfolio(options);
  };

  static async getCandles(exchange: string, options: {
    currency: string,
    asset: string,
    period: string,
    begin?: Date,
    end?: Date
  }): Promise<Array<{
    time: Date,
    open: number,
    high: number,
    low: number,
    close: number
  }>> {
    return exchanges[exchange].getCandles(options);
  };
};
