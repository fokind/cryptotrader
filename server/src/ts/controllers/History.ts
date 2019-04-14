import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { History } from "../models/History";
import { Candle } from "../models/Candle";
import connect from "../connect";

const collectionName = "history";

@odata.type(History)
@Edm.EntitySet("Histories")
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<History> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection // TODO заменить
    });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<History> {
    const db = await connect();
    const history = new History(data);
    return await db.collection(collectionName).insertOne(history).then((result) => {
      history._id = result.insertedId;
      return history;
    });
  }

  @odata.DELETE
  async delete(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("Candles")
  async getCandles(@odata.result result: any, @odata.query query: ODataQuery): Promise<Candle[]> {
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
}
