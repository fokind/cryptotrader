import { ODataServer, ODataController, Edm, odata, ODataQuery, result } from "odata-v4-server";
import { CandleController } from "./controllers/Candle";
import connect from "./connect";

const request = require('request');
const moment = require('moment');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

@odata.cors
@odata.namespace("Crypto.OData")
@odata.controller(CandleController, true)
export class CryptoServer extends ODataServer{
  @Edm.ActionImport
  async Update(): Promise<void>{
    request.get({
      baseUrl: BASE_URL,
      url: 'public/candles/XMRBTC',
      qs: {
        limit: 1000,
        period: 'H1'
      }
    }, (err, res, body) => {
      let candles = JSON.parse(body).map(e => ({
        moment: moment(e.timestamp).toDate(),
        open: +e.open,
        high: +e.max,
        low: +e.min,
        close: +e.close,
      }));

      const collectionName = "Candle";
      connect().then((db) => {
        db.collection(collectionName).insertMany(candles);
      });
    });
  }
}