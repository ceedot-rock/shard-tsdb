/**
 * shard-tsdb memory backend demo
 *   node examples/basic.mjs
 */
import { ShardTSDB } from "../dist/index.js";

const db = new ShardTSDB({ backend: "memory", blockSize: 32 });
const tags = { device: "demo" };
const t0 = Date.now();

const tss = [];
const vals = [];
let v = 20;
for (let i = 0; i < 64; i++) {
  tss.push(t0 + i * 1000);
  v += [-0.1, 0, 0, 0.1][i % 4];
  vals.push(v);
}

await db.putBatch("temp", tags, tss, vals);
await db.flushAll();

const range = await db.range("temp", tags, t0, t0 + 1e9);
const last = await db.last("temp", tags, 5);
const stats = await db.stats("temp", tags);

console.log({
  pointsIn: vals.length,
  rangePoints: range.tss.length,
  lastVals: last.vals,
  stats,
});
