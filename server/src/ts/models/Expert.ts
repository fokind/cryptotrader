import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
// import { ExpertController } from "./../controllers/Expert";
import { Candle } from "./Candle";
// import { Strategy } from "./Strategy";

import * as EventEmitter from "events";
import * as market from "../../../market";
import * as _ from 'lodash';
// import * as async from 'async';

const tulind = require('tulind');
import connect from "../connect";


export class Expert extends EventEmitter {
  // @Edm.Key
  // @Edm.Computed
  // @Edm.String
  // public _id: ObjectID

  @Edm.Key
  @Edm.String
  public currency: string

  @Edm.Key
  @Edm.String
  public asset: string

  @Edm.Key
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

  @Edm.DateTimeOffset
  public lastCandleTime: Date;

  // @Edm.EntityType(Edm.ForwardRef(() => Strategy))
  // Strategy: Strategy

  // @Edm.EntityType(Edm.ForwardRef(() => Ticker))
  // Ticker: Ticker

  public Candles: Candle[]

  @Edm.Action
  async update(@odata.result result: any): Promise<void> {
    const { currency, asset, period, Candles } = this;
    const expert = this;
    return new Promise(resolve => {
      market.getCandles({
        currency,
        asset,
        period,
      }, (err, newCandles) => {
        const diff = _.differenceWith(newCandles, Candles, _.isEqual);
        if (diff.length) {
          _.forEach(diff, e => Candles.push(e));
          // console.log(Candles, Candles[-1]);
          expert.lastCandleTime = Candles[Candles.length -1].time;
          expert.updateAdvice(result).then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  @Edm.Action
  async updateAdvice(@odata.result result: any): Promise<void> {
    const expert = this;
    const db = await connect();
    const { code } = await db.collection("strategy").findOne({ _id: expert.strategyId });
    const strategyFunction = new Function('candles, tulind, callback', code);
    const { Candles } = this;
    return new Promise(resolve => {
      strategyFunction(Candles, tulind, (err, advice) => {
        expert.advice = advice;
        resolve();
      });
    });
  }

  @Edm.Action
  async start(@odata.result result: any): Promise<void> {
  }

  @Edm.Action
  async stop(@odata.result result: any): Promise<void> {
  }

  constructor(jsonData: any) {
    super();

    this.active = false;
    this.Candles = [];
    this.delay = 60000; // должна зависеть от периода
    this.advice = 0;
    this.strategyId = new ObjectID("5c9bc2455b900921f05a8c2a"); // FIXME временно для примера!!! исправить только это

    Object.assign(this, <Expert>jsonData);

    this.on('newCandle', this.updateAdvice.bind(this));
  }
}

/*
сделать так, чтобы статистика накапливалась в системе, а для этого необходимо добавить рынки
эксперты подключаются к рынкам, следят за появлением новых свечей
у эксперта нельзя просто так поменять символ или период, для этого его нужно связать с другим рынком
точно так же нужно связать с другой стратегией, или поменять параметры стратегии
*/