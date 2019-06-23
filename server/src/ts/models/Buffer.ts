import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
// import { Indicator } from "./Indicator";
import { BufferRow } from "./BufferRow";

export class Buffer {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  public _id: ObjectID

  @Edm.String
  public exchangeKey: string

  @Edm.String
  public currency: string

  @Edm.String
  public asset: string

  @Edm.String
  public timeframe: string // https://ru.wikipedia.org/wiki/%D0%A2%D0%B0%D0%B9%D0%BC%D1%84%D1%80%D0%B5%D0%B9%D0%BC
  // moment.duration('P1Y2M3DT4H5M6S');

  @Edm.String
  public start?: string;
  // moment().format(); // "2014-09-08T08:02:00" (ISO 8601, no fractional seconds)
  // moment(1318874398806).unix(); // 1318874398

  @Edm.String
  public end?: string;

  // @Edm.Double
  // public balanceInitial: number // подумать заменить на balanceStart

  // @Edm.Computed
  // @Edm.Double
  // public balanceFinal: number

  // @Edm.String
  // public strategyId: ObjectID

  @Edm.String
  public indicatorKey: string // пока только с одним индикатором

  @Edm.String
  public indicatorOptions: string // дополнительные поля

  // @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => BufferRow)))
  // public Rows: BufferRow[]

  constructor(data) {
    Object.assign(this, data);
  }
}

// start time
// end time
// timespan
// start price
// end price
// market
// amount of trades
// start balance
// final balance
// simulated profit

// "trades": [
//   {
//       "id": "trade-1",
//       "adviceId": "advice-1", // backtestRowId
//       "action": "buy",
//       "cost": 0.30000000000000027, // нет
//       "amount": 1.01420229,
//       "price": 7019.99,
//       "portfolio": { // balance
//           "asset": 1.08661475,
//           "currency": 0
//       },
//       "balance": 7119.6899337771, // estimate
//       "date": 1522685280 // time
//   },
//   // and more
// ]
