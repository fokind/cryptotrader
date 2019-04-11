import { ODataServer, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { StrategyController } from "./controllers/Strategy";

@odata.cors
@odata.namespace("Crypto")
@odata.controller(BacktestController, true)
@odata.controller(StrategyController, true)
export class CryptoServer extends ODataServer {}
