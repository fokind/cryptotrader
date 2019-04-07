import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Candle } from "../models/Candle";

const request = require('request');
const moment = require('moment');
const BASE_URL = 'https://api.hitbtc.com/api/2/';
const collectionName = "candle";

@odata.type(Candle)
@Edm.EntitySet("Candles")
export class CandleController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Candle[]> {
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

  @Edm.Action
  async remove(): Promise<void> {
    const db = await connect();
    db.collection(collectionName).deleteMany({});
  }

  @Edm.Action
  async update(): Promise<void> {
    request.get({
      baseUrl: BASE_URL,
      url: 'public/candles/XMRBTC',
      qs: {
        limit: 1000,
        period: 'M1'
      }
    }, (err, res, body) => {
      let candles = JSON.parse(body).map(e => ({
        moment: moment(e.timestamp).toDate(),
        open: +e.open,
        high: +e.max,
        low: +e.min,
        close: +e.close,
      }));

      connect().then(db => {
        db.collection(collectionName).insertMany(candles);
      });
    });
  }
}
