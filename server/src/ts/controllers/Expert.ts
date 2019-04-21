import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Expert } from "../models/Expert";
import { Strategy } from "../models/Strategy";
import { MarketData } from "../models/MarketData";
import connect from "../connect";

const collectionName = "expert";

@odata.type(Expert)
@Edm.EntitySet("Experts")
export class ExpertController extends ODataController {
  async get(@odata.query query: ODataQuery): Promise<Expert[]> {
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Expert> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection // TODO заменить
    });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<Expert> {
    const db = await connect();
    const expert = new Expert(data); // добавить проверку входящих данных на соответствие типам
    // никогда не доверяй внешним входящим данным!!!
    expert.marketDataId = new ObjectID(data.marketDataId);
    expert.strategyId = new ObjectID(data.strategyId);
  
    return await db.collection(collectionName).insertOne(expert).then((result) => {
      expert._id = result.insertedId;
      return expert;
    });
  }

  @odata.DELETE
  async delete(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("MarketData")
  async getMarketData(@odata.result result: any, @odata.query query: ODataQuery): Promise<MarketData> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    const marketDataId = new ObjectID(result.marketDataId);
    return db.collection("marketData").findOne({ _id: marketDataId }, {
      fields: mongodbQuery.projection
    });
  }

  @odata.GET("Strategy")
  async getStrategy(@odata.result result: any, @odata.query query: ODataQuery): Promise<Strategy> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    const strategyId = new ObjectID(result.strategyId);
    return db.collection("strategy").findOne({ _id: strategyId }, {
      fields: mongodbQuery.projection
    });
  }
}
