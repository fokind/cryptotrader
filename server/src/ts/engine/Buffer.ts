import * as tulind from 'tulind';
import { ObjectID } from "mongodb";
import connect from "../connect";
import { ExchangeEngine, ICandle } from './Exchange';
import { BufferRow } from '../models/BufferRow';

export class BufferEngine {
  static calculateIndicator(name: string, candles: ICandle[], options: any): Promise<number[][]> {
    return tulind.indicators[name].indicator(tulind.indicators[name].input_names.map(e => candles.map(c => c[e])), options);
  };

  static async getRows(options: any): Promise<BufferRow[]> {
    // запросить свечи
    // нужна заданная длина ряда

    // console.log(typeof expertId);
    const { currency, asset, timeframe, exchangeKey, start, end, indicatorKey, indicatorOptions } = options;
    // // console.log({ strategyId, currency, asset, timeframe, exchangeKey });

    // const { code, indicatorKey, indicatorOptions, warmup } = await db.collection("strategy").findOne({ _id: strategyId });
    const candles = await ExchangeEngine.getCandles(exchangeKey, { currency, asset, timeframe, start, end });
    const indicators = (await BufferEngine.calculateIndicator(indicatorKey, candles, JSON.parse(indicatorOptions)))[0];
    const warmup = candles.length - indicators.length;

    const rows = [];

    for (let i = 0; i < candles.length; i++) {
      const row = new BufferRow(candles[i]);
      row.values = i >= warmup ? [ indicators[i - warmup] ] : [ 0 ];
      rows.push(row);
    }

    return rows;
  }
}
