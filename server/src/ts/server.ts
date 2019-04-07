import { ODataServer, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { BacktestRowController } from "./controllers/BacktestRow";
import { CandleController } from "./controllers/Candle";
import { StrategyController } from "./controllers/Strategy";

@odata.cors
@odata.namespace("Crypto")
@odata.controller(BacktestController, true)
@odata.controller(BacktestRowController, true)
@odata.controller(CandleController, true)
@odata.controller(StrategyController, true)
export class CryptoServer extends ODataServer {}
