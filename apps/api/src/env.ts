// Loads apps/api/.env into process.env. This must be imported before any
// module that reads process.env at import time (e.g. openrouter-ai-service.ts
// constructs its OpenRouter client at the top level). ES module imports are
// evaluated in source order, so importing this file as the very first line
// of server.ts guarantees env vars are populated before anything else runs.
//
// override: true makes .env always win over any variable already exported
// in the shell. Without this, a stale value exported earlier in a terminal
// session (or in a shell profile) silently takes precedence over .env and
// dotenv logs "injected (0)" with no indication anything is wrong.
import { config } from "dotenv";
import { setDefaultResultOrder } from "node:dns";

config({ override: true });

// Some networks advertise IPv6 but don't actually route it (common on
// consumer ISPs/routers). curl does "Happy Eyeballs" and silently falls
// back to IPv4 when that happens; Node's built-in fetch does not do this
// reliably, so it can hang on the IPv6 attempt until the whole request
// times out — even though a plain `curl` to the same host works instantly.
// Forcing ipv4first avoids that class of hang entirely.
setDefaultResultOrder("ipv4first");