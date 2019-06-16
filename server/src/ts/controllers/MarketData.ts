import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { MarketData } from "../models/MarketData";
import { Candle } from "../models/Candle";
import connect from "../connect";
import { ExchangeEngine } from "../engine/Exchange";

const collectionName = "marketData";

@odata.type(MarketData)
@Edm.EntitySet("MarketData")
export class MarketDataController extends ODataController {
  @odata.GET
  async get(@odata.query query: ODataQuery): Promise<MarketData[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (mongodbQuery.query._id) mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    const result = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
      .find(mongodbQuery.query)
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .map(e => new MarketData(e))
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<MarketData> {
    const { projection } = createQuery(query);
    const _id = new ObjectID(key);
    const db = await connect();
    return new MarketData(await db.collection(collectionName).findOne({ _id }, { projection }));
  }

  @odata.POST
  async post(@odata.body data: any): Promise<MarketData> {
    const db = await connect();
    const { currency, asset, timeframe, exchangeKey, start, end } = data; // TODO сделать везде по этому образцу
    const marketData: any = { currency, asset, timeframe, exchangeKey };
    if (start) marketData.start = start;
    if (end) marketData.start = end;

    // если начало и конец заполнены, то выполнить загрузку данных
    // на момент загрузки данных в базу этот экземпляр уже должен быть создан
    const result = await db.collection(collectionName).insertOne(marketData);
    // если есть начало и конец, то загрузить данные
    // предположим, что они есть
    marketData._id = result.insertedId;
    return new MarketData(marketData); // UNDONE поменять в UI
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
    const _id = new ObjectID(result._id);
    const { currency, asset, timeframe, exchangeKey, start, end } = <MarketData>(await db.collection(collectionName).findOne({ _id }));
    // console.log({ currency, asset, timeframe, exchangeKey, start, end });
    return (await ExchangeEngine.getExchange(exchangeKey).getCandles({ currency, asset, timeframe, start, end }))
      .map(e => new Candle(e));
  }
}
