# shard-tsdb

[![npm](https://img.shields.io/npm/v/shard-tsdb)](https://www.npmjs.com/package/shard-tsdb)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![site](https://img.shields.io/badge/site-slidphilabs.vercel.app-blue)](https://slidphilabs.vercel.app)

Pure JS **time-series database** with **Blackjack V2** compressed blocks.  
Backends: **in-memory** (default) or **IndexedDB** (browser).

## Install

```bash
npm i shard-tsdb
```

## Donate to SlidPhiLabs

**→ [Donate $29.99](https://buy.stripe.com/eVq9AUd7D0OY0CVdAQ6wE0a)** · [Support $199](https://buy.stripe.com/7sYbJ27NjfJSbhz8gw6wE09)

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
console.log(st); // { blocks, points, bytes, avgBitsPerPoint }
```

Browser:

```js
const db = new ShardTSDB({ backend: "indexeddb" });
```

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

## Related

- [shard-zip](https://www.npmjs.com/package/shard-zip) — standalone compressor
- [blackjack-compression](https://www.npmjs.com/package/blackjack-compression) — Blackjack v4 + file LZ77
- [slid-phi](https://www.npmjs.com/package/slid-phi) — Omni-Dormant integer pathways

Site: [slidphilabs.vercel.app](https://slidphilabs.vercel.app)

## License

MIT
