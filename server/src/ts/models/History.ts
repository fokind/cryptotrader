import { ObjectID } from "mongodb";
import { Edm, odata, ODataQuery } from "odata-v4-server";
import { Candle } from "./Candle";
import connect from "../connect";
import * as EventEmitter from "events";
import * as market from "../../../market";
import * as _ from 'lodash';
import * as moment from 'moment';

export class History extends EventEmitter {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

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
  public delay: number

  @Edm.Boolean
  public active: boolean

  @Edm.DateTimeOffset
  public begin: Date;

  @Edm.DateTimeOffset
  public end: Date;

  @Edm.ForeignKey("historyId")
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Candle)))
  public Candles: Candle[]

  @Edm.Action
  async update(@odata.result result: any) {
    const history = this;
    const { currency, asset, period, _id, end, begin } = this;
    // const candles = await historyController.getCandles(this, null); // TODO получить из контроллера не свечи, а дату последнего обновления, это можно и без контроллера сделать
    await new Promise(resolve => {
      market.getCandles({
        currency,
        asset,
        period,
      }, (err, candles: Candle[]) => {
        // исключить неполные свечи
        // заменить через дату, максимальная дата в первой и второй коллекции
        const diff = end ? candles.filter(e => moment(e.time).isAfter(end)) : candles;
        if (diff.length) {
          const delta = {
            end: candles[candles.length - 1].time
          };
          if (!begin) {
            (<History>delta).begin = candles[0].time;
          }
          connect().then(db => {
            return Promise.all([
              db.collection("candle").insertMany(diff.map(e => {
                e.historyId = _id;
                return e;
              })),
              db.collection("history").updateOne({ _id }, { $set: delta }),
            ]);
          }).then(() => {
            // FIXME history.emit("newCandle"); // вопрос, нужно ли здесь делать асинхронную обработку событий?
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  @Edm.Action
  async start(@odata.result result: any) {
  }

  @Edm.Action
  async stop(@odata.result result: any) {
  }

  constructor(jsonData: any) {
    super();

    this.active = false;
    this.delay = 60000; // должна зависеть от периода

    Object.assign(this, <History>jsonData);
  }
}

/*
сделать так, чтобы статистика накапливалась в системе, а для этого необходимо добавить рынки
эксперты подключаются к рынкам, следят за появлением новых свечей
у эксперта нельзя просто так поменять символ или период, для этого его нужно связать с другим рынком
точно так же нужно связать с другой стратегией, или поменять параметры стратегии
*/