import * as tulind from 'tulind';
import * as moment from 'moment';
import { Indicator } from '../models/Indicator';
import { ObjectID } from "mongodb";
import connect from "../connect";
import { Expert } from '../models/Expert';

export class ExpertEngine {
  // static calculateIndicator(name, candles, options): Promise<number[][]> {
  //   return tulind.indicators[name].indicator(tulind.indicators[name].input_names.map(e => candles.map(c => c[e])), options);
  // };

  // static async calculateAdvice({ // UNDONE должен всегда выполняться по живым данным, можно кэшировать
  //   candles,
  //   strategyFunction,
  //   indicators,
  // }: {
  //   candles: { time: string, close: number }[], // UNDONE переделать на строку!!!!!
  //   strategyFunction: Function,
  //   indicators: Indicator[],
  // }): Promise<number> {
  //   const sorted = candles.sort((a, b) => moment(a.time).isAfter(b.time) ? 1 : -1);
  //   const { name: indicatorName, options } = indicators[0]; // UNDONE сделать произвольное число индикаторов
  //   const reversedIndicators0 = (await ExpertEngine.calculateIndicator(indicatorName, sorted, JSON.parse(options)))[0].reverse(); // UNDONE заменить на пользовательский индикатор
  //   const advice = strategyFunction(reversedIndicators0);

  //   return new Promise<number>(resolve => resolve(advice));
  // };

  static async getAdvice(expertId: ObjectID): Promise<number> {
    // запросить свечи
    // нужна заданная длина ряда
    const db = await connect();
    var { strategyId } = (await db.collection("expert").findOne({ _id: expertId }))
    const { code } = await db.collection("strategy").findOne({ _id: strategyId });
    const indicators = [ 1 ]; // UNDONE доделать индикаторы!!!!
    const strategyFunction = new Function(
      'indicators',
      code,
    );
    return strategyFunction(indicators); // если 0, то вернет {}, не нашел как исправить
  }
}
