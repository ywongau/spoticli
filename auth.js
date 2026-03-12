const fs = require("node:fs");
const dotenv = require("dotenv");
const crypto = require("node:crypto");
const querystring = require("node:querystring");
const { SpotifyApi } = require("@spotify/web-api-ts-sdk");

dotenv.config();
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const tokenUrl = "https://accounts.spotify.com/api/token";
const redirectUrl = "https://example.org/callback";

const generateRandomString = (length) =>
  crypto.randomBytes(60).toString("hex").slice(0, length);
/*
  @returns {Promise<ReturnType<import('@spotify/web-api-ts-sdk').SpotifyApi['getAccessToken']>>}
*/
let accessToken = fs.existsSync("./token.json")
  ? require("./token.json")
  : null;
const ensureToken = () => {
  if (!accessToken) {
    return Promise.reject(
      new Error(
        "No access token found. Please run 'spoticlaw init' and then 'spoticlaw auth'.",
      ),
    );
  }
  const api = SpotifyApi.withAccessToken(client_id, accessToken);
  const twoMinutes = 2 * 60 * 1000;
  const shouldRenew = accessToken?.expires_at - Date.now() < twoMinutes;
  const tokenPromise = shouldRenew
    ? api.getAccessToken().then((newToken) => {
        accessToken = newToken;
        return accessToken;
      })
    : Promise.resolve(accessToken);
  return tokenPromise.then((token) =>
    SpotifyApi.withAccessToken(client_id, token),
  );
};
const scope =
  "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-recently-played user-top-read";
const init = () => {
  const state = generateRandomString(16);
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id,
      scope,
      redirect_uri: redirectUrl,
      state,
    });
  console.log(authUrl);
};

const validate = (response) =>
  response.ok
    ? response.json()
    : response
        .text()
        .then((text) =>
          Promise.reject(new Error(`${response.status} ${text}`)),
        );

const auth = (callbackUrl) => {
  const url = new URL(callbackUrl);
  const code = url.searchParams.get("code");
  const params = new URLSearchParams({
    code,
    redirect_uri: redirectUrl,
    scope,
    grant_type: "authorization_code",
  });

  return fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    body: params.toString(),
  })
    .then(validate)
    .then((body) => {
      const expires_at = Date.now() + 3600 * 1000;
      const token = JSON.stringify({ ...body, expires_at });
      fs.writeFileSync("token.json", token);
      console.log("Tokens saved to tokens.json");
    });
};

module.exports = {
  init,
  auth,
  ensureToken,
};
