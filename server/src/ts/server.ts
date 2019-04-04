import { ODataServer, Edm, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { BacktestRowController } from "./controllers/BacktestRow";
import { CandleController } from "./controllers/Candle";
import { StrategyController } from "./controllers/Strategy";
import connect from "./connect";

const request = require('request');
const moment = require('moment');

const BASE_URL = 'https://api.hitbtc.com/api/2/';

@odata.cors
@odata.namespace("Crypto.OData")
@odata.controller(BacktestController, true)
@odata.controller(BacktestRowController, true)
@odata.controller(CandleController, true)
@odata.controller(StrategyController, true)
export class CryptoServer extends ODataServer {
  @Edm.ActionImport
  async update(): Promise<void>{
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

      const collectionName = "candle";
      connect().then((db) => {
        db.collection(collectionName).insertMany(candles);
      });
    });
  }
}