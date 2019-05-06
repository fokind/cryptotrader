import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Indicator } from "../models/Indicator";
// import { IndicatorOption } from "../models/IndicatorOption";

const collectionName = "indicator";

@odata.type(Indicator)
@Edm.EntitySet("Indicators")
export class IndicatorController extends ODataController {
  async get(@odata.query query: ODataQuery): Promise<Account[]> {
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Account> {
    const db = await connect();
    const { projection } = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).findOne({_id: keyId}, {
      projection
    });
  }

  // @odata.GET("Options")
  // async getOptions(@odata.result result: any, @odata.query query: ODataQuery): Promise<IndicatorOption[]> {
  //   const db = await connect();
  //   const mongodbQuery = createQuery(query);
  //   const indicatorId = new ObjectID(result._id);
  //   // if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id); // зачем?
  //   // if (typeof mongodbQuery.query.accountId === "string") mongodbQuery.query.accountId = new ObjectID(mongodbQuery.query.accountId);
  //   // let creds = await db.collection("credential").find({ accountId: result._id }).toArray();

  //   let options = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("indicatorOption")
  //     .find({ $and: [{ indicatorId }, mongodbQuery.query] })
  //     .project(mongodbQuery.projection)
  //     .skip(mongodbQuery.skip || 0)
  //     .limit(mongodbQuery.limit || 0)
  //     .sort(mongodbQuery.sort)
  //     .toArray();
  //   if (mongodbQuery.inlinecount) {
  //     (<any>options).inlinecount = await db.collection("indicatorOption")
  //       .find({ $and: [{ indicatorId }, mongodbQuery.query] })
  //       .project(mongodbQuery.projection)
  //       .count(false);
  //   }
  //   return options;
  // }
}
