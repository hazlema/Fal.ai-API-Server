# FAL.ai server written in bun
Generate images with Flux-pro with this simple frontend written in Bun.

## New features

- SQLite database to store user info
- Login / Authentication 
- Create User (no email validation message yet)
- Expired Token Page
- 404 Page
- If you are authenticated already it skips the login page
- Credits

## Quick start

- Just edit the `/src/.env` file and give it your key then launch the server. `bun run server`
- The server defaults to hostname `localhost` running on port `3000`
- You can change that by editing the file `src/server.ts'

![web interface](./assets/web.png)

# Install
- Clone/Download the repo and run `bun install`
- If you don't have it:
	- Get bun here: http://bun.sh/
	- Get a Fal key here: http://fal.ai/

# Running
- Just edit the `/src/.env` file and give it your key then launch the server. `bun run server`
- The server defaults to hostname `localhost` running on port `3000`
- Navigate your browser to: http://localhost:3000/
