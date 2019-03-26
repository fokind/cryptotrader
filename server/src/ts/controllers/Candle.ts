import { Collection, ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Candle } from "../models/Candle";

const collectionName = "Candle";

@odata.type(Candle)
@Edm.EntitySet("Candles")
export class CandleController extends ODataController {
  @odata.GET
  public async find(@odata.query query: ODataQuery): Promise<Candle[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);

    if (typeof mongodbQuery.query._id === "string") {
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    }

    const result = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection(collectionName)
      .find(mongodbQuery.query)
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();

    if (mongodbQuery.inlinecount) {
      (result as any).inlinecount = await db.collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  public async findOne(@odata.key key: string, @odata.query query: ODataQuery): Promise<Candle> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch (err) { keyId = key; }
    return db.collection(collectionName).findOne({ _id: keyId }, {
      fields: mongodbQuery.projection,
    });
  }
}
