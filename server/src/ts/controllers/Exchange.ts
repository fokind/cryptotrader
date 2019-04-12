import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Exchange } from "../models/Exchange";
import { Ticker } from "../models/Ticker";
const exchange = require('../../../exchange');

const collectionName = "exchange";

@odata.type(Exchange)
@Edm.EntitySet("Exchanges")
export class ExchangeController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Exchange[]> {
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

  // @odata.GET
  // public async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Exchange> {
  //   const db = await connect();
  //   const mongodbQuery = createQuery(query);
  //   let keyId;
  //   try { keyId = new ObjectID(key); } catch (err) { keyId = key; }
  //   return db.collection(collectionName).findOne({ _id: keyId }, {
  //     fields: mongodbQuery.projection,
  //   });
  // }

  // @odata.POST
  // async post(@odata.body data: Exchange): Promise<Exchange> {
  //   const db = await connect();
  //   return await db.collection(collectionName).insertOne(data).then((result) => {
  //     data._id = result.insertedId;
  //     return data;
  //   });
  // }

  // @odata.PATCH
  // async patch(@odata.key key: string, @odata.body delta: any): Promise<number> {
  //   const db = await connect();
  //   if (delta._id) delete delta._id;
  //   let keyId;
  //   try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
  //   return await db.collection(collectionName).updateOne({_id: keyId}, {$set: delta}).then(result => result.modifiedCount);
  // }

  @Edm.Function
  @Edm.EntityType(Ticker)
  getTicker(@Edm.String currency: string, @Edm.String asset: string): Promise<Ticker> {
    return new Promise<Ticker>(resolve => {
      exchange.getTicker({
        currency,
        asset
      }, (err, ticker) => {
        resolve(<Ticker>ticker);
      });
    });
  };
}
