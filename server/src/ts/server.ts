import { ODataServer, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { StrategyController } from "./controllers/Strategy";
import { ExpertController } from "./controllers/Expert";
import { TraderController } from "./controllers/Trader";
import { AccountController } from "./controllers/Account";
import { MarketDataController } from "./controllers/MarketData";

@odata.cors
@odata.namespace("Crypto")
@odata.controller(BacktestController, true)
@odata.controller(StrategyController, true)
@odata.controller(ExpertController, true)
@odata.controller(TraderController, true)
@odata.controller(AccountController, true)
@odata.controller(MarketDataController, true)
export class CryptoServer extends ODataServer {}

// expert связан со стратегией
// имеет параметры
// возвращает совет
// есть метод обновления данных, который обращается к бирже
// связан со статистикой, необходимой для выработки совета
// может быть запущен и остановлен
// в активном состоянии запрашивает данные и генерирует события