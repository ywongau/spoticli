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
const accessToken = fs.existsSync("./token.json")
  ? JSON.parse(fs.readFileSync("./token.json", "utf8"))
  : null;

const generateRandomString = (length) =>
  crypto.randomBytes(60).toString("hex").slice(0, length);
/*
  @returns {Promise<ReturnType<import('@spotify/web-api-ts-sdk').SpotifyApi['getAccessToken']>>}
*/
const ensureToken = () => {

  if (!accessToken) {
    return Promise.reject(
      new Error(
        "No access token found. Please run 'spoticlaw init' and then 'spoticlaw auth'.",
      ),
    );
  }
  const twoMinutes = 2 * 60 * 1000;
  const shouldRenew = accessToken?.expires - Date.now() < twoMinutes;
  const tokenPromise = shouldRenew
    ? renewToken(accessToken.refresh_token, client_id)
    : Promise.resolve(accessToken);
  return tokenPromise.then((token) =>
    console.log(token) ?? SpotifyApi.withAccessToken(client_id, token),
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

const handleTokenReponse = (response) =>
  Promise.resolve(response).then(validate)
    .then(newToken =>
      SpotifyApi
        .withAccessToken(client_id, newToken)
        .getAccessToken()
    )
    .then((newToken) => {
      const combinedToken = {
        ...accessToken,
        ...newToken,
      }
      fs.writeFileSync("token.json", JSON.stringify(combinedToken));
      console.log("Tokens saved to tokens.json");
      return newToken;
    });

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
    .then(handleTokenReponse);
};

const renewToken = (refreshToken, clientId) => {
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: client_secret
    }).toString(),
  };
  console.log('Renewing token with payload', payload);
  return fetch(tokenUrl, payload)
    .then(handleTokenReponse);
}

module.exports = {
  init,
  auth,
  ensureToken,
};
