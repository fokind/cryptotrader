import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Expert } from "../models/Expert";
import { Trader } from "../models/Trader";
import { Ticker } from "../models/Ticker";
import { Portfolio } from "../models/Portfolio";
import connect from "../connect";
const exchange = require('../../../exchange'); // заменить на TS

const collectionName = "trader";

@odata.type(Trader)
@Edm.EntitySet("Traders")
export class TraderController extends ODataController {
  async get(@odata.query query: ODataQuery): Promise<Trader[]> {
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
  async getById(@odata.key key: string, @odata.query query: ODataQuery): Promise<Trader> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).findOne({_id: keyId}, {
      fields: mongodbQuery.projection // TODO заменить
    });
  }

  @odata.POST
  async post(@odata.body data: any): Promise<Trader> {
    const db = await connect();
    // const trader = new Trader(data); // добавить проверку входящих данных на соответствие типам
    // никогда не доверяй внешним входящим данным!!!
    if (data.expertId) data.expertId = new ObjectID(data.expertId);
    const { historyId } = await db.collection("expert").findOne({ _id: data.expertId });
    const { currency, asset } = await db.collection("history").findOne({ _id: historyId });
    data.currency = currency;
    data.asset = asset;
  
    return db.collection(collectionName).insertOne(data).then((result) => {
      data._id = result.insertedId;
      return new Trader(data);
    });
  }

  @odata.DELETE
  async delete(@odata.key key: string): Promise<number> {
    const db = await connect();
    let keyId;
    try { keyId = new ObjectID(key); } catch(err) { keyId = key; }
    return await db.collection(collectionName).deleteOne({_id: keyId}).then(result => result.deletedCount);
  }

  @odata.GET("Ticker")
  async getTicker(@odata.result result: any): Promise<Ticker> {
    // сначала получить валюту, а это можно только через Expert/History
    // FIXME это нужно делать заранее
    // const trader = new Trader(result);
    const { currency, asset } = result;
    return await new Promise<Ticker>(resolve => {
      exchange.getTicker({
        currency,
        asset
      }, (err, ticker) => {
        resolve(new Ticker(ticker));
      });
    });
  }

  @odata.GET("Portfolio")
  async getPortfolio(@odata.result result: any): Promise<Portfolio[]> {
    const _id = new ObjectID(result._id);
    const db = await connect();
    const { user, pass } = await db.collection(collectionName).findOne({ _id });
    return await new Promise<Portfolio[]>(resolve => {
      exchange.getPortfolio({ user, pass }, (err, res: any[]) => {
        const portfolio = res.map(e => new Portfolio(e));
        resolve(portfolio);
      });
    });
  }

  @odata.GET("Expert")
  async getExpert(@odata.result result: any, @odata.query query: ODataQuery): Promise<Expert> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    const expertId = new ObjectID(result.expertId);
    return await db.collection("expert").findOne({ _id: expertId }, {
      fields: mongodbQuery.projection
    });
  }
}
