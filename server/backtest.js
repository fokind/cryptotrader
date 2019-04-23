const tulind = require('tulind');
const async = require('async');
const moment = require('moment');

function backtest({
  candles,
  strategyFunction,
  balanceInitial,
}, callback) {
  async.map(candles,
    (candle, cb) => strategyFunction(candles.slice(0, candles.indexOf(candle) + 1), tulind, console, (err, advice) => {
      cb(undefined, { candle, advice });
    }),
    (err, advices) => {
      const sorted = advices.sort((a, b) => moment(a.candle.time).isAfter(b.candle.time) ? 1 : -1);
      const backtestRows = [];
      for (let i = 0; i < candles.length; i++) { // TODO заменить на candles.map()
        const { advice, candle } = sorted[i];
        const price = candle.close;
        const prev = i > 0 ? backtestRows[i - 1] : null;
        let balance = i > 0 ? prev.balance : +balanceInitial;
        let balanceAsset = i > 0 ? prev.balanceAsset : 0;

        if (advice === 1) {
          balanceAsset += balance / price;
          balance = 0;
        } else if (advice === -1) {
          balance += balanceAsset * price;
          balanceAsset = 0;
        }

        backtestRows.push({
          advice,
          balance,
          balanceAsset,
          balanceEstimate: balance + balanceAsset * price,
          close: candle.close,
          time: candle.time,
        });
      }

      callback(null, backtestRows);
    }
  );
}

module.exports = {
  backtest
}
