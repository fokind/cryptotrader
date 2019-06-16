import * as tulind from 'tulind';
import * as moment from 'moment';
import { BacktestRow } from '../models/BacktestRow';
import { Indicator } from '../models/Indicator';

// class Buffer {
//   currency: string;
//   asset: string;
//   time: Date;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   indicators: Array<{ name: string, value: number }>;
//   advice: number;
// }

export class BacktestEngine {
  // static async calculateIndicators(
  //   inputs: Array<{ open?: number, high?: number, low?: number, close?: number }>,
  //   name: string = 'cci', // адаптировать под остальные индикаторы
  //   options: any,
  // ): Promise<any> {
  //   return new Promise<any>(resolve => {
  //     const { period } = <{ period: number }>options; // для каждого индикатора свой набор
  //     // const open = inputs.map(e => e.open);
  //     const high = inputs.map(e => e.high);
  //     const low = inputs.map(e => e.low);
  //     const close = inputs.map(e => e.close);
  
  //     tulind.indicators[name].indicator([ high, low, close ], [ period ]).then(outputs => {
  //       resolve(outputs[0]);
  //     });
  //   });
  // };

  static calculateIndicator(name, candles, options): Promise<number[][]> {
    return tulind.indicators[name].indicator(tulind.indicators[name].input_names.map(e => candles.map(c => c[e])), options);
  };

  static async backtest({
    candles,
    strategyFunction,
    balanceInitial,
    indicators,
  }: {
    candles: { time: string, close: number }[], // FIXME перевести в дату
    strategyFunction: Function,
    balanceInitial: number,
    indicators: Indicator[],
  }): Promise<BacktestRow[]> {
    const sorted = candles.sort((a, b) => moment(a.time).isAfter(b.time) ? 1 : -1);
    const { name: indicatorName, options } = indicators[0]; // UNDONE сделать произвольное число индикаторов
    const reversedIndicators0 = (await BacktestEngine.calculateIndicator(indicatorName, sorted, JSON.parse(options)))[0].reverse(); // UNDONE заменить на пользовательский индикатор
    const candlesLength = candles.length;
    const buffer = sorted.map((candle, index) => ({
      time: candle.time, // UNDONE формат??
      close: candle.close,
      indicator: reversedIndicators0[candlesLength - index - 1],
      advice: strategyFunction(reversedIndicators0.slice(candlesLength - index - 1)), // UNDONE заменить на пользовательскую функцию
      // UNDONE свечи тоже можно передавать
    }));

    const backtestRows = [];
    for (let i = 0; i < candles.length; i++) { // TODO заменить на candles.map()
      const { advice, time, close, indicator } = buffer[i];
      const prev = i > 0 ? backtestRows[i - 1] : null;
      let balance = i > 0 ? prev.balance : +balanceInitial;
      let balanceAsset = i > 0 ? prev.balanceAsset : 0;

      if (advice === 1) {
        balanceAsset += balance / close;
        balance = 0;
      } else if (advice === -1) {
        balance += balanceAsset * close;
        balanceAsset = 0;
      }

      backtestRows.push({
        advice,
        balance,
        balanceAsset,
        balanceEstimate: balance + balanceAsset * close,
        close,
        time: time,
        indicator,
      });
    }

    return new Promise<BacktestRow[]>(resolve => resolve(backtestRows));
  };
}
