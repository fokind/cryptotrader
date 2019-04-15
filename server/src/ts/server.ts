import { ODataServer, odata } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";
import { StrategyController } from "./controllers/Strategy";
import { TickerController } from "./controllers/Ticker";
import { ExpertController } from "./controllers/Expert";
import { HistoryController } from "./controllers/History";
import { TraderController } from "./controllers/Trader";

@odata.cors
@odata.namespace("Crypto")
@odata.controller(BacktestController, true)
@odata.controller(StrategyController, true)
@odata.controller(TickerController, true)
@odata.controller(ExpertController, true)
@odata.controller(HistoryController, true)
@odata.controller(TraderController, true)
export class CryptoServer extends ODataServer {}

// expert связан со стратегией
// имеет параметры
// возвращает совет
// есть метод обновления данных, который обращается к бирже
// связан со статистикой, необходимой для выработки совета
// может быть запущен и остановлен
// в активном состоянии запрашивает данные и генерирует события