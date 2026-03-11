# A Spotify CLI for AI agents


### Prerequisites

Environment variables:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `NGROK_DOMAIN` (e.g. `https://abc123.ngrok-free.app`)

## Authorization flow

A simple express application to obtain access token from spotify

- Agent starts server, request ${NGROK_DOMAIN}/login, return a redirect URL to spotify authorization page as plain/text
- Agent reads the redirect URL, send to user to login to spotify and authorize the app
- User clicks the redirect URL, logs in and authorizes the app, spotify will redirect to ${NGROK_DOMAIN}/callback with code
- Web server exchange code for access token, and save the access token in .env file, and close the server