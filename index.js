#!/usr/bin/env node

const { program } = require("commander");
const { auth, init, ensureToken } = require("./auth");
const basic = (item) => ({ name: item.name, id: item.id });
const logJson = (obj) => console.log(JSON.stringify(obj));
program
  .name("spoticlaw")
  .description("Spotify CLI for OpenClaw")
  .version("1.0.0");

program
  .command("init")
  .description("Display the Spotify authorization URL for user authentication")
  .action(init);

program
  .command("auth")
  .argument(
    "<callbackUrl>",
    "The callback URL received after user authentication",
  )
  .description("given callback URL, exchange code for access token")
  .action(auth);

program
  .command("devices")
  .description("List all available Spotify devices")
  .action(async () => {
    const api = await ensureToken();
    const items = await api.player.getAvailableDevices();
    logJson(items.devices.map(basic));
  });

program
  .command("transfer")
  .argument("<id>")
  .action(async (id) => {
    const api = await ensureToken();
    await api.player.transferPlayback([id], true).then(logJson);
  });

program
  .command("play")
  .argument("<query>")
  .argument("[deviceId]", "Optional device ID to play on")
  .action(async (query, deviceId) => {
    const sdk = await ensureToken();
    const searchResults = await sdk.search(query, ["track"], "US", 10);
    const searchResults2 = await sdk.search(query, ["track"], "US", 10, 10);
    const tracks = searchResults.tracks.items.concat(searchResults2.tracks.items);
    if (!tracks.length) {
      console.log("Tracks not found.");
      return;
    }

    if (tracks.length > 0) {
      const trackUris = tracks.map((track) => track.uri);
      await sdk.player.startResumePlayback(deviceId, null, trackUris);
      console.log(
        `Now playing top tracks for ${tracks.map((track) => track.name)}`,
      );
    } else {
      console.log("No top tracks found for this artist.");
    }
  });

program
  .command("playlist")
  .argument("<query>")
  .argument("[deviceId]", "Optional device ID to play on")
  .option("-r, --random", "Options to play a random playlist in the search results")
  .action(async (query, deviceId, options) => {
    const sdk = await ensureToken();
    const searchResults = await sdk.search(query, ["playlist"], "US", 10);
    if (!searchResults.playlists.items.length) {
      console.log("Playlist not found.");
      return;
    }
    console.log('Found playlists', searchResults.playlists.items);
    const index = options.random ? Math.floor(Math.random() * searchResults.playlists.items.length) : 0;
    const playlist = searchResults.playlists.items[index];
    await sdk.player.startResumePlayback(deviceId, playlist.uri);
  });

program
  .command("sdk")
  .description("Call sdk endpoints")
  .argument("<endpoint>", "name of an endpoint on sdk, see node_modules/@spotify/web-api-ts-sdk/dist/cjs/SpotifyApi.d.ts")
  .argument("<function>", "name of a method on the specified endpoint")
  .argument("[arg1]", "First argument")
  .argument("[arg2]", "Second argument")
  .argument("[arg3]", "Third argument")
  .argument("[arg4]", "Fourth argument")
  .argument("[arg5]", "Fifth argument")
  .action(async (endpoint, func, ...args) => {
    const sdk = await ensureToken();
    return sdk[endpoint][func](...args).then(logJson).catch(console.error);
  });
program.parse(process.argv);
