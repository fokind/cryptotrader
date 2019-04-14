import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
// import { ExpertController } from "./../controllers/Expert";
// import { Candle } from "./Candle";
import { Strategy } from "./Strategy";
import { History } from "./History";

// import * as EventEmitter from "events";
// import * as market from "../../../market";
import * as _ from 'lodash';
// import * as async from 'async';

const tulind = require('tulind');
import connect from "../connect";

export class Expert {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public period: string

  @Edm.Int32
  public advice: number

  @Edm.Int32
  public delay: number

  @Edm.Boolean
  public active: boolean

  @Edm.String
  public strategyId: ObjectID

  @Edm.String
  public historyId: ObjectID

  @Edm.DateTimeOffset
  public lastCandleTime: Date;

  @Edm.EntityType(Edm.ForwardRef(() => Strategy))
  Strategy: Strategy

  @Edm.EntityType(Edm.ForwardRef(() => History))
  History: History

  // public Candles: Candle[]

  // @Edm.Action
  // async update(@odata.result result: any): Promise<void> {
  //   const { currency, asset, period, Candles } = this;
  //   const expert = this;
  //   return new Promise(resolve => {
  //     market.getCandles({
  //       currency,
  //       asset,
  //       period,
  //     }, (err, newCandles) => {
  //       const diff = _.differenceWith(newCandles, Candles, _.isEqual);
  //       if (diff.length) {
  //         _.forEach(diff, e => Candles.push(e));
  //         // console.log(Candles, Candles[-1]);
  //         expert.lastCandleTime = Candles[Candles.length -1].time;
  //         expert.updateAdvice(result).then(() => {
  //           resolve();
  //         });
  //       } else {
  //         resolve();
  //       }
  //     });
  //   });
  // }

  @Edm.Action
  async update(@odata.result result: any): Promise<number> {
    // сначала обновить рыночные данные
    // дождаться результата и при наличии обновлений выполнить перерасчет стратегии
    const expert = this;
    const { historyId, _id, strategyId } = this;

    // const historyId = new ObjectID(this.historyId);
    const db = await connect();

    // создать экземпляр маркета
    console.log(typeof historyId);
    const historyData = await db.collection("history").findOne({ _id: historyId });
    console.log(historyData);

    const history = new History(await db.collection("history").findOne({ _id: historyId }));
    console.log(await db.collection("history").findOne({ _id: historyId }));

    // вызвать метод для обновления данных
    // если не ноль, тогда продолжить, если ноль, тогда вернуть ноль
    if (await history.update(history)) {
      const candles = await db.collection("candle").find({ historyId }).toArray();
      const { code } = await db.collection("strategy").findOne({ _id: strategyId });
      const strategyFunction = new Function('candles, tulind, callback', code);

      return await new Promise<number>(resolve => {
        strategyFunction(candles, tulind, (err, advice) => {
          if (expert.advice !== advice) {
            const delta = { advice };
            db.collection("expert").updateOne({ _id }, { $set: delta }).then(result => {
              resolve(result.modifiedCount);
            });
          }
          resolve(0);
        });
      });
    } else {
      return 0;
    }
  }

  @Edm.Action
  async start(@odata.result result: any): Promise<void> {
  }

  @Edm.Action
  async stop(@odata.result result: any): Promise<void> {
  }

  constructor(jsonData: any) {
    // super();

    // FIXME так делать неправильно

    this.active = false;
    // this.Candles = [];
    this.delay = 60000; // должна зависеть от периода
    this.advice = 0;
    // this.strategyId = new ObjectID("5c9bc2455b900921f05a8c2a"); // FIXME временно для примера!!! исправить только это
    // this.historyId = new ObjectID("5cb30494e4277f20c4dab8f8");

    Object.assign(this, jsonData);

    // this.on('newCandle', this.updateAdvice.bind(this));
  }
}

/*
сделать так, чтобы статистика накапливалась в системе, а для этого необходимо добавить рынки
эксперты подключаются к рынкам, следят за появлением новых свечей
у эксперта нельзя просто так поменять символ или период, для этого его нужно связать с другим рынком
точно так же нужно связать с другой стратегией, или поменять параметры стратегии

рынки добавлены
эксперт именно создается
пока условия изменить нельзя
можно создать другого эксперта
при создании эксперта задается ссылка на массив данных
при обновлении эксперта сначала обновляется этот массив и при наличии новых данных выполняется расчет по стратегии
*/