# shard-tsdb


<p align="center">
  <img src="./brand/slid-phi-labs-master.jpg" alt="Zero Range Wave · Slid Phi Labs" width="720"/>
</p>

<p align="center"><strong>Slid Phi Labs</strong> — official product branding</p>

<p align="center"><img src="https://raw.githubusercontent.com/ceedot-rock/splabs-brand/main/assets/brand/logos/logo-shard-tsdb.jpg" alt="product logo" width="280"/></p>


[![npm](https://img.shields.io/npm/v/shard-tsdb)](https://www.npmjs.com/package/shard-tsdb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![site](https://img.shields.io/badge/site-www.slidphilabs.com-blue)](https://www.slidphilabs.com)

**Pure-JS time-series database** with **Blackjack V2 compressed blocks** — built for sensors, walks, and smooth deltas where generic stores waste space. Backends: **in-memory** (default) or **IndexedDB** (browser).

| | |
|--|--|
| **npm** | [`shard-tsdb@0.2.4`](https://www.npmjs.com/package/shard-tsdb) |
| **site** | [www.slidphilabs.com](https://www.slidphilabs.com) |
| **license** | [MIT](./LICENSE) |

---

## Why this exists

Time-series from sensors and game/telemetry counters often look like **runs, ±1 walks, and smooth deltas**. Storing them as raw floats or gzipped JSON is easy — and bulky. shard-tsdb packs points into **Blackjack V2** blocks so you get a small pure-JS TSDB without native codecs or a server.

For record-class **integer sequence** ratios (zeros / ramps / walks), see sibling **[Zero Range Wave](https://www.npmjs.com/package/zero-range-wave-compression)**.

---

## Install

```bash
npm i shard-tsdb
```

Node **≥ 18**. Works in the browser with the IndexedDB backend.

---

## Quick start

```js
import { ShardTSDB } from "shard-tsdb";

const db = new ShardTSDB({ backend: "memory", blockSize: 256 });

const tags = { sensor: "temp-1" };
await db.put("room", tags, Date.now(), 21.5);
await db.putBatch(
  "room",
  tags,
  [1, 2, 3, 4, 5].map((i) => Date.now() + i * 1000),
  [21.5, 21.6, 21.6, 21.7, 21.5],
);
await db.flushAll();

const { tss, vals } = await db.range("room", tags, 0, Date.now() + 1e12);
const last = await db.last("room", tags, 10);
const st = await db.stats("room", tags);
// { blocks, points, bytes, avgBitsPerPoint }
```

Browser:

```js
const db = new ShardTSDB({ backend: "indexeddb" });
```

---

## API (`ShardTSDB`)

| Method | Description |
|--------|-------------|
| `constructor({ backend?, blockSize? })` | `backend`: `'memory'` \| `'indexeddb'` |
| `put(name, tags, ts, val)` | Append one point |
| `putBatch(name, tags, tss[], vals[])` | Append many |
| `flushAll()` | Force block flush |
| `range(name, tags, start, end)` | Points in time range |
| `last(name, tags, n)` | Last *n* points |
| `stats(name, tags)` | Block/point/byte stats |

Also exports `BlackjackV2` / `BlackjackCodec` for direct series coding.

---

## Donate to Slid Phi Labs

**→ [Donate $29.99](https://buy.stripe.com/eVq9AUd7D0OY0CVdAQ6wE0a)** · [Support $199](https://buy.stripe.com/7sYbJ27NjfJSbhz8gw6wE09)

---

## Related packages

| Package | Role |
|---------|------|
| [zero-range-wave-compression](https://www.npmjs.com/package/zero-range-wave-compression) | ZRW v5 — beats gzip/brotli on zeros/ramps/walks |
| [blackjack-compression](https://www.npmjs.com/package/blackjack-compression) | Blackjack v4 general int/byte/file compressor |
| [shard-zip](https://www.npmjs.com/package/shard-zip) | Adaptive Fib + Blackjack V2 + CLI |
| [slid-phi](https://www.npmjs.com/package/slid-phi) | Omni-Dormant integer pathways |
| [CuNi Studio](https://cuni-studio.fly.dev/) | Exact multi-target code playground |

Brand home: **[www.slidphilabs.com](https://www.slidphilabs.com)**

---

## License

MIT

## Agentic commerce

Agents can buy / quote lab products via **x402** (USDC on Solana mainnet or Base mainnet).

```
Agent commerce: GET https://www.slidphilabs.com/api/agent then pay via x402 on Solana or Base mainnet (X-PAYMENT) on catalog POST.
```

| Surface | URL |
|---------|-----|
| Discovery | https://www.slidphilabs.com/api/agent |
| Catalog | https://www.slidphilabs.com/api/x402-products |
| agents.txt | https://www.slidphilabs.com/agents.txt |
| agents.json | https://www.slidphilabs.com/agents.json |
| llms.txt | https://www.slidphilabs.com/llms.txt |

Humans: [www.slidphilabs.com](https://www.slidphilabs.com) (Stripe).
