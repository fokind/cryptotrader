const tulind = require('tulind');
const async = require('async');

function backtest({
  candles,
  strategyFunction,
  balanceInitial,
}, callback) {
  async.map(candles,
    (candle, cb) => strategyFunction(candles.slice(0, candles.indexOf(candle) + 1), tulind, cb),
    (err, advices) => {
      const backtestRows = [];
      for (let i = 0; i < candles.length; i++) { // TODO заменить на candles.map()
        const advice = advices[i];
        const candle = candles[i];
        const price = candle.close;
        const prev = i > 0 ? backtestRows[i - 1] : null;
        let balanceFrom = i > 0 ? prev.balanceFrom : balanceInitial;
        let balanceTo = i > 0 ? prev.balanceTo : 0;

        if (advice === 1) {
          balanceFrom = 0;
          balanceTo += prev.balanceFrom / price;
        } else if (advice === -1) {
          balanceFrom += prev.balanceTo * price;
          balanceTo = 0;
        }

        backtestRows.push({
          advice,
          balanceFrom,
          balanceTo,
          balanceEstimate: balanceFrom + balanceTo * price,
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
