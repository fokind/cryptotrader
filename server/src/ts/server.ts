import { ODataServer, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { StrategyController } from "./controllers/Strategy";
import { ExchangeController } from "./controllers/Exchange";

@odata.cors
@odata.namespace("Crypto")
@odata.controller(BacktestController, true)
@odata.controller(StrategyController, true)
@odata.controller(ExchangeController, true)
export class CryptoServer extends ODataServer {}
