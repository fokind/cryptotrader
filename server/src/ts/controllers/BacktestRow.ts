import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { BacktestRow } from "../models/BacktestRow";
import { Candle } from "../models/Candle";

import connect from "../connect";

const collectionName = "backtestRow";

@odata.type(BacktestRow)
@Edm.EntitySet("BacktestRows")
export class BacktestRowController extends ODataController {
  @odata.GET
  async find(@odata.query query: ODataQuery): Promise<BacktestRow[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id == "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    let result = typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
      .find(mongodbQuery.query)
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>result).inlinecount = await db.collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  async findOne(@odata.key key: string, @odata.query query: ODataQuery): Promise<BacktestRow> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection
    });
  }

  @odata.POST
  async insert(@odata.body data: any): Promise<BacktestRow> {
    const db = await connect();
    // срабатывает только если в body содержится хотя бы одно значение
    if (typeof data.backtestId === "string") data.backtestId = new ObjectID(data.backtestId);
    return await db.collection(collectionName).insertOne(data).then((result) => {
      data._id = result.insertedId;
      return data;
    });
  }

  @odata.PUT
  async upsert(@odata.key key: string, @odata.body data: any, @odata.context context: any): Promise<BacktestRow> {
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
  async update(@odata.key key: string, @odata.body delta: any): Promise<number> {
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

  @odata.GET("Candle")
  async getCandle(@odata.result result: BacktestRow, @odata.query query: ODataQuery): Promise<Candle> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let key = result.candleId;
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection("candle").findOne({_id: keyId}, {
      fields: mongodbQuery.projection
    });
  }
}
