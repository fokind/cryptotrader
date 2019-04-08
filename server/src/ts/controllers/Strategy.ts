import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Strategy } from "../models/Strategy";
import { Backtest } from "../models/Backtest";

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

  @odata.PATCH
  async update(@odata.key key: string, @odata.body delta: any): Promise<number> {
    const db = await connect();
    if (delta._id) delete delta._id;
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).updateOne({_id: keyId}, {$set: delta}).then(result => result.modifiedCount);
  }

  @odata.GET("Backtests")
  async getBacktests(@odata.result result: Strategy, @odata.query query: ODataQuery): Promise<Backtest[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    if (typeof mongodbQuery.query.strategyId === "string") mongodbQuery.query.strategyId = new ObjectID(mongodbQuery.query.strategyId);
    let backtests = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("backtest")
      .find({ $and: [{ strategyId: result._id }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>backtests).inlinecount = await db.collection("backtest")
        .find({ $and: [{ strategyId: result._id }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return backtests;
  }

  @odata.GET("Backtests")
  async getBacktest(@odata.key key: string, @odata.result result: Strategy, @odata.query query: ODataQuery): Promise<Backtest> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    if (typeof mongodbQuery.query.strategyId === "string") mongodbQuery.query.strategyId = new ObjectID(mongodbQuery.query.strategyId);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return db.collection("backtest").findOne({
      $and: [{ _id: keyId, strategyId: result._id }, mongodbQuery.query]
    }, {
      fields: mongodbQuery.projection
    });
  }

  @odata.POST("Backtests").$ref
  @odata.PUT("Backtests").$ref
  @odata.PATCH("Backtests").$ref
  async setBacktest(@odata.key key: string, @odata.link link: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    let linkId;
    try { linkId = new ObjectID(link); } catch(err) { linkId = link; }
    return await db.collection("backtest").updateOne({
      _id: linkId
    }, {
      $set: { strategyId: keyId }
    }).then((result) => {
      return result.modifiedCount;
    });
  }

  @odata.DELETE("Backtests").$ref
  async unsetBacktest(@odata.key key: string, @odata.link link: string): Promise<number> {
    const db = await connect();
    let linkId;
    try { linkId = new ObjectID(link); } catch(err) { linkId = link; }
    return await db.collection("backtest").updateOne({
      _id: linkId
    }, {
      $unset: { strategyId: 1 }
    }).then((result) => {
      return result.modifiedCount;
    });
  }
}
