import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Strategy } from "../models/Strategy";
import { Backtest } from "../models/Backtest";
import { Indicator } from "../models/Indicator";

const collectionName = "strategy";

@odata.type(Strategy)
@Edm.EntitySet("Strategies")
export class StrategyController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Strategy[]> {
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
  public async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Strategy> {
    const { projection } = createQuery(query);
    const _id = new ObjectID(key);
    const db = await connect();
    return new Strategy(await db.collection(collectionName).findOne({ _id }, { projection }));
  }

  @odata.POST
  async post(@odata.body data: any): Promise<Strategy> {
    const { name, warmup, code, indicatorKey, indicatorOptions } = data;
    const strategy: any = {
      name,
      warmup,
      code,
      indicatorKey,
      indicatorOptions,
    };

    const db = await connect();
    strategy._id = (await db.collection(collectionName).insertOne(strategy)).insertedId;
    return new Strategy(strategy);
  }

  @odata.PATCH
  async patch(@odata.key key: string, @odata.body delta: any): Promise<number> {
    const db = await connect();
    const { name, warmup, code, indicatorKey, indicatorOptions } = delta;
    const strategy: any = {};
    if (name) strategy.name = name;
    if (warmup) strategy.warmup = warmup;
    if (code) strategy.code = code;
    if (indicatorKey) strategy.indicatorKey = indicatorKey;
    if (indicatorOptions) strategy.indicatorOptions = indicatorOptions;

    const _id = new ObjectID(key);
    return await db.collection(collectionName).updateOne({ _id }, { $set: delta }).then(result => result.modifiedCount);
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

  @odata.GET("Indicators")
  async getIndicators(@odata.result result: Strategy, @odata.query query: ODataQuery): Promise<Indicator[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    const strategyId = new ObjectID(result._id);
    // if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id); // зачем?
    // if (typeof mongodbQuery.query.accountId === "string") mongodbQuery.query.accountId = new ObjectID(mongodbQuery.query.accountId);
    // let creds = await db.collection("credential").find({ accountId: result._id }).toArray();

    let indicators = typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0 ? [] : await db.collection("indicator")
      .find({ $and: [{ strategyId }, mongodbQuery.query] })
      .project(mongodbQuery.projection)
      .skip(mongodbQuery.skip || 0)
      .limit(mongodbQuery.limit || 0)
      .sort(mongodbQuery.sort)
      .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>indicators).inlinecount = await db.collection("indicator")
        .find({ $and: [{ strategyId }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return indicators;
  }

  // @odata.GET("Backtests")
  // async getBacktest(@odata.key key: string, @odata.result result: Strategy, @odata.query query: ODataQuery): Promise<Backtest> {
  //   const db = await connect();
  //   const mongodbQuery = createQuery(query);
  //   if (typeof mongodbQuery.query._id === "string") mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
  //   if (typeof mongodbQuery.query.strategyId === "string") mongodbQuery.query.strategyId = new ObjectID(mongodbQuery.query.strategyId);
  //   let keyId;
  //   try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
  //   return db.collection("backtest").findOne({
  //     $and: [{ _id: keyId, strategyId: result._id }, mongodbQuery.query]
  //   }, {
  //     fields: mongodbQuery.projection
  //   });
  // }

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
