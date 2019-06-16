import { ODataController, Edm, odata } from "odata-v4-server";
import { Exchange } from "../models/Exchange";
import { ExchangeEngine } from "../engine/Exchange";

@odata.type(Exchange)
@Edm.EntitySet("Exchange")
export class ExchangeController extends ODataController {
  @odata.GET
  get(): Exchange[] {
    return ExchangeEngine.getExchangeKeys().map(key => new Exchange({ key }));
  }

  @odata.GET
  getById(@odata.key key: string): Exchange {
    return new Exchange({
      key: ExchangeEngine.getExchangeKeys().find(e => e === key)
    });
  }
  // список периодов
  // список валютных пар
}
