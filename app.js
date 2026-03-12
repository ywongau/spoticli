var express = require("express");
var request = require("request");
var crypto = require("crypto");
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
var fs = require("fs");
var dotenv = require("dotenv");

dotenv.config();

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var domain = process.env.NGROK_DOMAIN;
var redirect_uri = domain + "/callback"; // Your redirect uri

const generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

var stateKey = "spotify_auth_state";

var app = express();

app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-follow-modify",
  "user-follow-read",
  "user-read-playback-position",
  "user-top-read",
  "user-read-recently-played",
  "user-library-modify",
  "user-library-read",
  "user-read-email",
  "user-read-private"
].join(" ");

  // your application requests authorization
  var authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scopes,
      redirect_uri: redirect_uri,
      state: state,
    });

  // Return the authorization URL as plain text for AI agents to read and forward to user
  res.type("text/plain").send(authUrl);
});

app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;

      var expires_at = Date.now() + 3600 * 1000;

     

      // Write tokens to .env file

      // Response with JSON containing the tokens
      const token = JSON.stringify(body);
      fs.writeFileSync("token.json", token);

      res.send(JSON.stringify(body));
      console.log("Tokens saved to tokens.env, shutting down the server...");
      server.close();
    } else {
      res.status(500).send({
        error: "invalid_token",
      });
    }

  });
});

app.get("/refresh_token", function (req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;
      var expires_at = Date.now() + 3600 * 1000;
      // Write tokens to .env file
      var envContent =
        "ACCESS_TOKEN=" + access_token + "\nREFRESH_TOKEN=" + refresh_token + "\nEXPIRES_AT=" + expires_at;
      fs.writeFileSync("tokens.env", envContent);
      res.send({
        access_token: access_token,
        refresh_token: refresh_token,
      });
    }

  });
});



console.log(`Listening on 8888
1. HTTP GET ${domain}/login and send it to the user to start the authentication process. 
2. User will nontify you once they have authenticated. By that time the tokens are available in the 'tokens.env' file.
3. HTTP POST ${domain}/stop to shutdown the server. After authentication, you can use the CLI to make API calls to Spotify on behalf of the user.
`);
var server = app.listen(8888);
