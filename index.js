var { Edm, odata, ODataController, ODataServer, ODataErrorHandler, ODataHttpContext, HttpRequestError } = require("odata-v4-server");
var express = require('express');
var STATUS_CODES = require('http').STATUS_CODES;
var { CryptoServer } = require("./server/lib/ts/server");

const app = express();
var CookieStrategy = require('passport-cookie').Strategy;

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

app.use(express.static('static/webapp'));

app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

class AuthenticationError extends HttpRequestError{
  constructor() {
    super(401, STATUS_CODES[401]);
  }
}

app.use(
  "/odata",
  CryptoServer.create(),
  ODataErrorHandler
);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
