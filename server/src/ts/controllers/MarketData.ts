import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { MarketData } from "../models/MarketData";
import { Candle } from "../models/Candle";
import connect from "../connect";

const collectionName = "marketData";

@odata.type(MarketData)
@Edm.EntitySet("MarketData")
export class MarketDataController extends ODataController {
  @odata.GET
  async get(@odata.query query: ODataQuery): Promise<MarketData[]> {
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<MarketData> {
    const db = await connect();
    const { projection } = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection(collectionName).findOne({ _id: keyId }, { projection });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<MarketData> {
    const db = await connect();
    const { currency, asset, period } = data; // TODO сделать везде по этому образцу
    // если начало и конец заполнены, то выполнить загрузку данных
    // на момент загрузки данных в базу этот экземпляр уже должен быть создан
    const result = await db.collection(collectionName).insertOne({ currency, asset, period });
    // если есть начало и конец, то загрузить данные
    // предположим, что они есть
    return new MarketData({ _id: result.insertedId, currency, asset, period });
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
    if (typeof mongodbQuery.query.marketDataId === "string") mongodbQuery.query.marketDataId = new ObjectID(mongodbQuery.query.marketDataId);
    let candles = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("candle")
      .find({ $and: [{ marketDataId: result._id }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>candles).inlinecount = await db.collection("candle")
        .find({ $and: [{ marketDataId: result._id }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return candles;
  }
}
