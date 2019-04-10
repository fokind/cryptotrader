import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Backtest } from "../models/Backtest";
import { BacktestRow } from "../models/BacktestRow";
import connect from "../connect";
import { backtest } from "../../../backtest";
import * as market from "../../../market";
import * as moment from "moment";
// import _eval from "eval";

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
  insert(@odata.body data: Backtest): Promise<Backtest> {
    data.duration = moment.duration(moment(data.end).diff(data.begin)).days() + 1;
    return new Promise<Backtest>(resolve => {
      connect().then(db => {
        // срабатывает только если в body содержится хотя бы одно значение
        // const candlesPromise = db.collection("candle").find({}).sort({ time: 1 }).toArray(); // TODO выбирать нужные свечи
        const candlesPromise = new Promise(resolve => {
          market.getCandles({
            currency: data.currency,
            asset: data.asset,
            period: data.period,
            end: data.end,
            duration: data.duration, // TODO здесь задается период с по какое число получить статистику, а этот параметр упразднить
          }, (err, candles) => {
            resolve(candles);
          });
        });
        const strategyPromise = db.collection("strategy").findOne({ _id: data.strategyId });
        Promise.all([candlesPromise, strategyPromise]).then((result) => {
          const candles = result[0];
          // console.log(result[1].code);
          // const strategyFunction = _eval(result[1].code);
          // console.log(strategyFunction);
          const strategyFunction = new Function(
            'candles, tulind, callback',
            result[1].code,
          );
          // data._id = result[2].insertedId;
          
          return new Promise(resolve => {
            backtest({
              candles,
              strategyFunction,
              balanceInitial: data.balanceInitial,
            }, (err, backtestRows) => {
              resolve(backtestRows);
            });
          });
        }).then((backtestRows) => {
          const backtestRowFirst = <BacktestRow>backtestRows[0];
          const backtestRowLast = <BacktestRow>backtestRows[(<Array<any>>backtestRows).length - 1];

          // data.timeFrom = backtestRowFirst.time;
          // data.timeTo = backtestRowLast.time;
          data.priceInitial = backtestRowFirst.close;
          data.priceFinal = backtestRowLast.close;
          data.priceChange = data.priceFinal / data.priceInitial - 1;
          data.balanceFinal = backtestRowLast.balanceEstimate;
          data.balanceChange = data.balanceFinal / data.balanceInitial - 1;
          
          // data.balanceEstimate = backtestRowLast.balanceEstimate;
          // data.result = data.balanceEstimate / data.balanceInitial;

          db.collection(collectionName).insertOne(data).then(result => {
            // присвоить backtestId
            return db.collection("backtestRow").insertMany((<Array<any>>backtestRows).map(e => {
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
