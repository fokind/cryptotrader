import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
// import { MarketData } from "../models/MarketData";
// import { Candle } from "../models/Candle";
import connect from "../connect";
import { Buffer } from "../models/Buffer"; // FIXME конфликтует с системным названием, можно заменить на ...Model
import { BufferRow } from "../models/BufferRow";
import { BufferEngine } from "../engine/Buffer";
// import { ExchangeEngine } from "../engine/Exchange";

const collectionName = "buffer";

@odata.type(Buffer)
@Edm.EntitySet("Buffers")
export class BufferController extends ODataController {
  @odata.GET
  async get(@odata.query query: ODataQuery): Promise<Buffer[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (mongodbQuery.query._id)
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    const result =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection(collectionName)
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .map(e => new Buffer(e))
            .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>result).inlinecount = await db
        .collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  async getById(
    @odata.key key: string,
    @odata.query query: ODataQuery
  ): Promise<Buffer> {
    const { projection } = createQuery(query);
    const _id = new ObjectID(key);
    const db = await connect();
    return await db.collection(collectionName).findOne({ _id }, { projection });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<Buffer> {
    const db = await connect();
    const { currency, asset, timeframe, exchangeKey, start, end } = data; // TODO сделать везде по этому образцу
    const buffer: any = {
      currency,
      asset,
      timeframe,
      exchangeKey
    };
    if (start) buffer.start = start;
    if (end) buffer.start = end;

    // если начало и конец заполнены, то выполнить загрузку данных
    // на момент загрузки данных в базу этот экземпляр уже должен быть создан
    const result = await db.collection(collectionName).insertOne(buffer);
    // если есть начало и конец, то загрузить данные
    // предположим, что они есть
    buffer._id = result.insertedId;
    return new Buffer(buffer); // UNDONE поменять в UI
  }

  // @odata.DELETE
  // async delete(@odata.key key: string): Promise<number> {
  //   const db = await connect();
  //   let keyId;
  //   try {
  //     keyId = new ObjectID(key);
  //   } catch (err) {
  //     keyId = key;
  //   }
  //   return await db
  //     .collection(collectionName)
  //     .deleteOne({ _id: keyId })
  //     .then(result => result.deletedCount);
  // }

  @odata.GET("Rows")
  async getRows(@odata.result result: any, @odata.query query: ODataQuery): Promise<BufferRow[]> {
    const _id = new ObjectID(result._id);
    // const db = await connect();
    // const {
    //   currency,
    //   asset,
    //   timeframe,
    //   exchangeKey,
    //   indicatorKey,
    //   indicatorOptions,
    //   start,
    //   end
    // } = <Buffer>await db.collection(collectionName).findOne({ _id });
    return BufferEngine.getRows(_id);
  }

  // @Edm.Function
  // @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BufferRow)))
  // public async getRows(@odata.body options: any): Promise<BufferRow[]> {
  //   const {
  //     currency,
  //     asset,
  //     timeframe,
  //     exchangeKey,
  //     indicatorKey,
  //     indicatorOptions,
  //     start,
  //     end
  //   } = options;
  //   return await BufferEngine.getRows({
  //     currency,
  //     asset,
  //     timeframe,
  //     exchangeKey,
  //     indicatorKey,
  //     indicatorOptions,
  //     start,
  //     end
  //   });
  // }
}
