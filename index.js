#!/usr/bin/env node

var request = require("request");
var { spawn } = require("child_process");
var fs = require("fs");
var dotenv = require("dotenv");
var path = require("path");
var { program } = require("commander");
var dotenv = require('dotenv');
var crypto = require('crypto');
var querystring = require('querystring');
const { SpotifyApi } = require( '@spotify/web-api-ts-sdk');
const token = require('./token.json');
dotenv.config();
var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var domain = process.env.NGROK_DOMAIN;
var redirect_uri = domain + '/callback'; // Your redirect uri

const generateRandomString = (length) => {
  return crypto
  .randomBytes(60)
  .toString('hex')
  .slice(0, length);
}

const startServer = () =>
  spawn("node", [path.join(__dirname, "app.js")], {
    detached: false,
    stdio: "inherit",
  });

const auth = () => {
  var state = generateRandomString(16);
  const scope =   [
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
  var authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });
  console.log(authUrl);
};

program
  .name("spoticli")
  .description("Spotify CLI for AI agents")
  .version("1.0.0");

program
  .command("init")
  .description("Display the Spotify authorization URL for user authentication")
  .action(auth);

program
  .command('auth')
  .description('Start the authentication server')
  .action(startServer);

program
  .command('devices')
  .description('List all available Spotify devices')
  .action(async () => {
    const api = SpotifyApi.withAccessToken(client_id, token)
    const newToken = await api.getAccessToken();
    console.log('Access Token:', newToken);
    const items = await api.search('Nier Automata','album');
    console.log(items.albums.items);
  });

program.parse(process.argv);
