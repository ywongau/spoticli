#!/usr/bin/env node

const { program } = require("commander");
const { auth, init, ensureToken } = require("./auth");
const basic = (item) => ({ name: item.name, id: item.id });
program
  .name("spoticli")
  .description("Spotify CLI for AI agents")
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
    console.log(JSON.stringify(items.devices.map(basic)));
  });

program
  .command("transfer")
  .argument("<id>")
  .action(async (id) => {
    const api = await ensureToken();
    const items = await api.player.transferPlayback([id], true);
    console.log(items);
  });

program
  .command("play")
  .argument("<query>")
  .argument("[deviceId]", "Optional device ID to play on")
  .action(async (query, deviceId) => {
    const sdk = await ensureToken();
    const searchResults = await sdk.search(query, ["track"], "US", 10);
    const tracks = searchResults.tracks.items;
    console.log("deviceId", deviceId);
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

program.parse(process.argv);
