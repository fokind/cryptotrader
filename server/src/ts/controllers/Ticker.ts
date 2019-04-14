import { Edm, odata, ODataController } from "odata-v4-server";
import { Ticker } from "../models/Ticker";
const exchange = require('../../../exchange');

@odata.type(Ticker)
@Edm.EntitySet("Tickers")
export class TickerController extends ODataController {
  @odata.GET
  public get(): Promise<Ticker[]> {
    return new Promise<Ticker[]>(resolve => resolve([]));
  }

  @odata.GET
  public getById(@odata.key currency: string, @odata.key asset: string): Promise<Ticker> {
    return new Promise<Ticker>(resolve => {
      exchange.getTicker({
        currency,
        asset
      }, (err, ticker) => {
        ticker.currency = currency;
        ticker.asset = asset;
        resolve(<Ticker>ticker);
      });
    });
  }
}
