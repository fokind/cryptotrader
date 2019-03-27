import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Strategy } from "../models/Strategy";

const collectionName = "strategy";

@odata.type(Strategy)
@Edm.EntitySet("Strategies")
export class StrategyController extends ODataController {
  @odata.GET
  public async find(@odata.query query: ODataQuery): Promise<Strategy[]> {
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
  public async findOne(@odata.key key: string, @odata.query query: ODataQuery): Promise<Strategy> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch (err) { keyId = key; }
    return db.collection(collectionName).findOne({ _id: keyId }, {
      fields: mongodbQuery.projection,
    });
  }

  @odata.POST
  async insert(@odata.body data: any): Promise<Strategy> {
    const db = await connect();
    return await db.collection(collectionName).insertOne(data).then((result) => {
      data._id = result.insertedId;
      return data;
    });
  }
}
