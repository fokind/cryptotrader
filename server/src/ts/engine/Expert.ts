import * as tulind from 'tulind';
import * as moment from 'moment';
import { Indicator } from '../models/Indicator';

export class ExpertEngine {
  static calculateIndicator(name, candles, options): Promise<number[][]> {
    return tulind.indicators[name].indicator(tulind.indicators[name].input_names.map(e => candles.map(c => c[e])), options);
  };

  static async calculateAdvice({
    candles,
    strategyFunction,
    indicators,
  }: {
    candles: { time: string, close: number }[], // UNDONE переделать на строку!!!!!
    strategyFunction: Function,
    indicators: Indicator[],
  }): Promise<number> {
    const sorted = candles.sort((a, b) => moment(a.time).isAfter(b.time) ? 1 : -1);
    const { name: indicatorName, options } = indicators[0]; // UNDONE сделать произвольное число индикаторов
    const reversedIndicators0 = (await ExpertEngine.calculateIndicator(indicatorName, sorted, JSON.parse(options)))[0].reverse(); // UNDONE заменить на пользовательский индикатор
    const advice = strategyFunction(reversedIndicators0);

    return new Promise<number>(resolve => resolve(advice));
  };
}
