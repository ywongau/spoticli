---
name: spotify-skill
description: Allow the assistant to control Spotify playback from chat using the installed spoticlaw/spoticli CLI. Maps simple chat commands to CLI invocations and uses the saved default device from MEMORY.md.
---

# Spotify skill

This skill lets the assistant run the spoticlaw CLI in response to chat commands in group conversations (family WhatsApp group or other specified chats).

# Setup

- Assistant ask user to provide environment variables and SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, and store it in .env in working directory where `spoticlaw` is called
- Assistant run `init` and send the authorization URL to user, and ask user to copy the callback URL from browser after login is successful
- Assistant run `auth "<callback URL>"` whichi will write token.json to working directory. Now the other commans are ready for use

# Commands

## spoticlaw player

## sdk <endpoint> <function> [arg1] [arg2] [arg3] [arg4] [arg5]

Call sdk endpoints. See node_modules/@spotifyweb-api-ts-sdk/dist/cjs/SpotifyApi.d.ts

## play <query> [deviceId] 

Search and play top 20 tracks

## playlist [options] <query> [deviceId] [-r, --random]

Search and play 1st playlist, or random out of top 10 if -r provided

Triggers (user-visible examples):

- "play <query>" → plays a track/album/playlist matching <query> on the default device
- "play <query> on <device name|device id>" → plays on specified device
- "pause" → pause playback
- "next" / "prev" → skip forward/back
- "volume <0-100>" → set volume
- "devices" → list available devices
- "set default device <device id|name>" → save default device to MEMORY.md

Behaviour and implementation notes:

- The skill will use the system CLI at ~/.npm-global/bin/spoticli (or spoticlaw if present).
- When a matching chat command is received, the assistant will run the corresponding CLI command in the workspace environment and return a short confirmation message to the chat.
- For playback commands without an explicit device, the assistant will read MEMORY.md for the saved default Spotify device id and use it. If no default exists, it will return a short error and list available devices.
- Auth: relies on the spoticlaw/spoticli tokens stored in the package directory (token.json). Ensure auth flow completed before usage.

Security and safety:

- The skill will only accept playback commands from authorized chats (default: family WhatsApp group). To add or remove authorized chats, edit this skill file or tell the assistant.
- The assistant will not expose tokens or client secrets in chat. CLI output that includes sensitive fields will be filtered.

Examples (assistant -> executed CLI):

- "play Nier Automata" → `~/.npm-global/bin/spoticli play "Nier Automata" <default-device-id>`
- "devices" → `~/.npm-global/bin/spoticli devices`
- "set default device c31bd1..." → save to MEMORY.md and confirm

Logging and audit:

- The assistant will log CLI invocations to workspace/logs/spotify_skill.log (append-only) with timestamps and the invoking user/chat id.

Deployment:

- Place this file under /home/yok/.openclaw/workspace/skills/spotify/SKILL.md to register the skill.
- The assistant will start using the skill immediately for matching chat messages in authorized chats.
- The assistant should NOT ask for confirmation before executing commands, nor will ask follow-up questions. Only displays the tracks in the queue
