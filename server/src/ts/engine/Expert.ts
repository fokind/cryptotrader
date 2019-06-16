import * as tulind from 'tulind';
import { ObjectID } from "mongodb";
import connect from "../connect";
import { ExchangeEngine, ICandle } from './Exchange';

export class ExpertEngine {
  static calculateIndicator(name: string, candles: ICandle[], options: any): Promise<number[][]> {
    return tulind.indicators[name].indicator(tulind.indicators[name].input_names.map(e => candles.map(c => c[e])), options);
  };

  static async getAdvice(expertId: ObjectID): Promise<number> {
    // запросить свечи
    // нужна заданная длина ряда

    // console.log(typeof expertId);
    const db = await connect();
    var { strategyId, currency, asset, timeframe, exchangeKey } = (await db.collection("expert").findOne({ _id: expertId }))
    // console.log({ strategyId, currency, asset, timeframe, exchangeKey });

    const { code, indicatorKey, indicatorOptions, warmup } = await db.collection("strategy").findOne({ _id: strategyId });
    // console.log({ code, indicatorKey, indicatorOptions, warmup });

    var candles = await ExchangeEngine.getCandles(exchangeKey, { currency, asset, timeframe, limit: warmup });

    const indicators = (await ExpertEngine.calculateIndicator(indicatorKey, candles, JSON.parse(indicatorOptions)))[0].reverse();
    // console.log(indicators);

    const strategyFunction = new Function(
      'indicators',
      code,
    );
    return strategyFunction(indicators); // если 0, то вернет {}, не нашел как исправить
  }
}
