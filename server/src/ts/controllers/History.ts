import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { History } from "../models/History";
import { Candle } from "../models/Candle";
import connect from "../connect";

const request = require('request');
const moment = require('moment');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

const collectionName = "history";

@odata.type(History)
@Edm.EntitySet("History")
export class HistoryController extends ODataController {
  @odata.GET
  async get(@odata.query query: ODataQuery): Promise<History[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    let result = typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
      .find(mongodbQuery.query)
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();//TODO заменить на поток
    if (mongodbQuery.inlinecount) {
      (<any>result).inlinecount = await db.collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  async getOne(@odata.key key: string, @odata.query query: ODataQuery): Promise<History> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection
    });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<History> {
    const db = await connect();
    // срабатывает только если в body содержится хотя бы одно значение
    if (typeof data.strategyId === "string") data.strategyId = new ObjectID(data.strategyId);

    return await db.collection(collectionName).insertOne(data).then((result) => {
      data._id = result.insertedId;
      return data;
    });
  }

  @odata.PUT
  async put(@odata.key key: string, @odata.body data: any, @odata.context context: any): Promise<History> {
    const db = await connect();
    if (data._id) delete data._id;
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).updateOne({_id: keyId}, data, {
      upsert: true
    }).then((result) => {
      data._id = result.upsertedId
      return data._id ? data : null;
    });
  }

  @odata.PATCH
  async patch(@odata.key key: string, @odata.body delta: any): Promise<number> {
    const db = await connect();
    if (delta._id) delete delta._id;
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).updateOne({_id: keyId}, {$set: delta}).then(result => result.modifiedCount);
  }

  @odata.DELETE
  async remove(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("Candles")
  async getCandles(@odata.result result: History, @odata.query query: ODataQuery): Promise<Candle[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    if (typeof mongodbQuery.query.historyId === "string") mongodbQuery.query.historyId = new ObjectID(mongodbQuery.query.historyId);
    let candles = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("candle")
      .find({ $and: [{ historyId: result._id }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>candles).inlinecount = await db.collection("candle")
        .find({ $and: [{ historyId: result._id }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return candles;
  }

  @odata.GET("Candles")
  async getCandle(@odata.key key: string, @odata.result result: History, @odata.query query: ODataQuery): Promise<Candle> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    if (typeof mongodbQuery.query.historyId === "string") mongodbQuery.query.historyId = new ObjectID(mongodbQuery.query.historyId);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection("candle").findOne({
      $and: [{ _id: keyId, historyId: result._id }, mongodbQuery.query]
    }, {
      fields: mongodbQuery.projection
    });
  }

  // @Edm.Action
  // async update(): Promise<void> {
  //   console.log(1);
  //   request.get({
  //     baseUrl: BASE_URL,
  //     url: 'public/candles/XMRBTC',
  //     qs: {
  //       limit: 1000,
  //       period: 'H1'
  //     }
  //   }, (err, res, body) => {
  //     let candles = JSON.parse(body).map(e => ({
  //       moment: moment(e.timestamp).toDate(),
  //       open: +e.open,
  //       high: +e.max,
  //       low: +e.min,
  //       close: +e.close,
  //     }));

  //     const collectionName = "candle";
  //     connect().then((db) => {
  //       db.collection(collectionName).insertMany(candles);
  //     });
  //   });
  // }
}
