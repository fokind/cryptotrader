import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Backtest } from "../models/Backtest";
import { BacktestRow } from "../models/BacktestRow";
import connect from "../connect";
import moment = require("moment");
import { Candle } from "../models/Candle";
import { BacktestEngine } from "../engine/Backtest";

const collectionName = "backtest";

@odata.type(Backtest)
@Edm.EntitySet("Backtests")
export class BacktestController extends ODataController {
  // @odata.GET
  // async find(@odata.query query: ODataQuery): Promise<Backtest[]> {
  //   const db = await connect();
  //   const mongodbQuery = createQuery(query);
  //   if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
  //   let result = typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
  //     .find(mongodbQuery.query)
  //     .project(mongodbQuery.projection)
  //     .skip(mongodbQuery.skip || 0)
  //     .limit(mongodbQuery.limit || 0)
  //     .sort(mongodbQuery.sort)
  //     .toArray();//TODO заменить на поток
  //   if (mongodbQuery.inlinecount) {
  //     (<any>result).inlinecount = await db.collection(collectionName)
  //       .find(mongodbQuery.query)
  //       .project(mongodbQuery.projection)
  //       .count(false);
  //   }
  //   return result;
  // }

  @odata.GET
  async getOne(@odata.key key: string, @odata.query query: ODataQuery): Promise<Backtest> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection // TODO заменить
    });
  }

  @odata.POST
  async insert(@odata.body data: any): Promise<Backtest> {
    const { marketDataId, begin, end } = data; // FIXME аналогичный косяк с часовым поясом, исправляется в UI
    const db = await connect();
    const keyMarketDataId = new ObjectID(marketDataId);
    const { currency, asset, period } = await db.collection("marketData").findOne({ _id: keyMarketDataId });
    data.currency = currency;
    data.asset = asset;
    data.period = period;
    // FIXME если выходит за пределы, то ошибка!
    // FIXME выполнить явное преобразование data в backtest с валидацией, т.к. в data значения числовые
    return new Promise<Backtest>(resolve => {
      connect().then(db => {
        // срабатывает только если в body содержится хотя бы одно значение
        // const candlesPromise = db.collection("candle").find({}).sort({ time: 1 }).toArray(); // TODO выбирать нужные свечи
        // const q = {
        //   marketDataId: keyMarketDataId,
        //   time: {
        //     $gte: new Date(begin).toISOString(),
        //     $lte: new Date(end).toISOString()
        //   }
        // };
        // console.log(q);
        // UNDONE Это не работает, необходимо перевести на string вместо даты
        // неизвестно как это будет себя проявлять с другими базами данных

        const q = {
          marketDataId: keyMarketDataId
        };

        const candlesPromise = <Promise<Array<Candle>>>db.collection("candle").find(q).toArray();

        const strategyPromise = db.collection("strategy").findOne({ _id: data.strategyId });
        Promise.all([candlesPromise, strategyPromise]).then((result) => {
          const candles = result[0].filter(e => moment(e.time).isBetween(begin, end, 'd', "[]"));
          console.log(candles.length);

          const strategyFunction = new Function(
            'candles, tulind, console, callback',
            result[1].code,
          );
          
          return new Promise(resolve => {
            BacktestEngine.backtest({
              candles,
              strategyFunction,
              balanceInitial: data.balanceInitial,
            }).then(backtestRows => {
              resolve(backtestRows);
            });
          });
        }).then((backtestRows: BacktestRow[]) => {
          const backtestRowFirst = backtestRows[0];
          const backtestRowLast = backtestRows[backtestRows.length - 1];

          // data.timeFrom = backtestRowFirst.time;
          // data.timeTo = backtestRowLast.time;

          data.priceInitial = backtestRowFirst.close;
          data.priceFinal = backtestRowLast.close;
          data.priceChange = (data.priceFinal / data.priceInitial - 1) * 100;
          data.balanceFinal = backtestRowLast.balanceEstimate;
          data.balanceChange = (data.balanceFinal / data.balanceInitial - 1) * 100;
          data.duration = moment(backtestRowLast.time).add(1, 'm').diff(backtestRowFirst.time, 'd');
          
          // data.balanceEstimate = backtestRowLast.balanceEstimate;
          // data.result = data.balanceEstimate / data.balanceInitial;

          db.collection(collectionName).insertOne(data).then(result => {
            // присвоить backtestId
            return db.collection("backtestRow").insertMany(backtestRows.map(e => {
              e.backtestId = result.insertedId;
              return e;
            }));
          }).then(() => {
            resolve(<Backtest>data);
          });
        });
      });
    });
  }

  // @odata.PUT
  // async upsert(@odata.key key: string, @odata.body data: any, @odata.context context: any): Promise<Backtest> {
  //   const db = await connect();
  //   if (data._id) delete data._id;
  //   let keyId;
  //   try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
  //   return await db.collection(collectionName).updateOne({_id: keyId}, data, {
  //     upsert: true
  //   }).then((result) => {
  //     data._id = result.upsertedId
  //     return data._id ? data : null;
  //   });
  // }

  // @odata.PATCH
  // async update(@odata.key key: string, @odata.body delta: any): Promise<number> {
  //   const db = await connect();
  //   if (delta._id) delete delta._id;
  //   let keyId;
  //   try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
  //   return await db.collection(collectionName).updateOne({_id: keyId}, {$set: delta}).then(result => result.modifiedCount);
  // }

  @odata.DELETE
  async remove(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("Rows")
  async getRows(@odata.result result: Backtest, @odata.query query: ODataQuery): Promise<BacktestRow[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    if (typeof mongodbQuery.query.backtestId === "string") mongodbQuery.query.backtestId = new ObjectID(mongodbQuery.query.backtestId);
    let backtestRows = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("backtestRow")
      .find({ $and: [{ backtestId: result._id }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>backtestRows).inlinecount = await db.collection("backtestRow")
        .find({ $and: [{ backtestId: result._id }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return backtestRows;
  }
}
