// shard-tsdb v0.2 with Blackjack V2
const FIB = [1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765,10946,17711,28657,46368,75025,121393,196418,317811,514229,832040,1346269,2178309,3524578,5702887,9227465,14930352,24157817,39088169,63245986,102334155,165580141,267914296,433494437,701408733,1134903170,1836311903];
function encodeZeckInt(n: number){ if(n===0) return {bits:0, len:1}; let rem=n, bits=0, maxIdx=0, used=0; while(rem>0){ let idx=-1; let lo=0,hi=FIB.length-1; while(lo<=hi){ const mid=(lo+hi>>1); if(FIB[mid]<=rem){ idx=mid; lo=mid+1; } else hi=mid-1; } if(idx<0) break; while(idx>=0 && ((used>>(idx+1))&1)) idx--; while(idx>=0 && ((used>>idx)&1)) idx--; if(idx<0) break; used|=(1<<idx); bits|=(1<<idx); rem-=FIB[idx]; if(idx>maxIdx) maxIdx=idx; } return {bits, len:maxIdx+1}; }
function encodeFibInt(n: number){ const {bits,len}=encodeZeckInt(n+1); return {bits: bits | (1<<len), len: len+1}; }
function decodeFibInt(bitsInt:number, blen:number){ const data=bitsInt & ((1<<(blen-1))-1); let total=0; for(let i=0;i<blen-1;i++) if((data>>i)&1) total+=FIB[i]; return total-1; }
const N_MAX=10000;
const ENCODE_LUT: {bits:number, len:number}[]=[]; for(let i=0;i<=N_MAX;i++) ENCODE_LUT[i]=encodeFibInt(i);
function bitsToInt(bits: number[]){ let v=0; for(let i=0;i<bits.length;i++) if(bits[i]) v|=(1<<i); return v; }
function intToBits(val:number, blen:number){ const out:number[]=[]; for(let i=0;i<blen;i++) out.push((val>>i)&1); return out; }
function decodeOneFibAt(bits: number[], start: number){ const n=bits.length; for(let end=start+2; end<=Math.min(start+32, n); end++){ const chunk=bits.slice(start,end); if(chunk.length<2 || chunk[chunk.length-2]!==1 || chunk[chunk.length-1]!==1) continue; const data=chunk.slice(0,-1); let has11=false; for(let k=0;k<data.length-1;k++) if(data[k]===1 && data[k+1]===1){ has11=true; break; } if(has11) continue; const b=bitsToInt(chunk); try{ const v=decodeFibInt(b, chunk.length); return {val:v, end}; }catch{} } return null; }

class BlackjackBase{
  codes: Record<string, number[]>; trie: any; variant: string;
  constructor(variant:'C'|'E'|'I'|'G'){
    if(variant==='C') this.codes={repeat:[0], inc:[1,0], dec:[1,1,0], normal:[1,1,1]};
    else if(variant==='E') this.codes={normal:[0], repeat:[1,0], inc:[1,1,0], dec:[1,1,1]};
    else if(variant==='I') this.codes={inc:[0], repeat:[1,0], dec:[1,1,0], normal:[1,1,1]};
    else this.codes={normal:[0], inc:[1,0], repeat:[1,1,0], dec:[1,1,1]};
    this.variant=variant;
    this.trie={};
    for(const [op,code] of Object.entries(this.codes)){
      let node=this.trie;
      for(let i=0;i<code.length;i++){ const b=code[i]; if(!(b in node)) node[b]={}; node=node[b]; if(i===code.length-1) node['_op']=op; }
    }
  }
  encode(values: number[], K=0): number[]{
    if(values.length===0) return [];
    const out:number[]=[];
    const first=values[0];
    if(K>1 && first>=K){
      out.push(1,1,1,0);
      const q=Math.floor(first/K); const r=first%K;
      const qb = q<=N_MAX ? ENCODE_LUT[q] : encodeFibInt(q);
      out.push(...intToBits(qb.bits, qb.len));
      out.push(...intToBits(r, Math.ceil(Math.log2(K))));
    }else{
      const {bits, len}= first<=N_MAX ? ENCODE_LUT[first] : encodeFibInt(first);
      out.push(...intToBits(bits,len));
    }
    let prev=first;
    for(let i=1;i<values.length;i++){
      const v=values[i];
      let op: string;
      if(v===prev) op='repeat'; else if(v===prev+1) op='inc'; else if(v===prev-1) op='dec'; else op='normal';
      out.push(...this.codes[op]);
      if(op==='normal'){
        if(K>1 && v>=K){
          const q=Math.floor(v/K); const r=v%K;
          const qb = q<=N_MAX ? ENCODE_LUT[q] : encodeFibInt(q);
          out.push(...intToBits(qb.bits, qb.len));
          out.push(...intToBits(r, Math.ceil(Math.log2(K))));
          prev=v;
        }else{
          const {bits, len}= v<=N_MAX ? ENCODE_LUT[v] : encodeFibInt(v);
          out.push(...intToBits(bits,len));
          prev=v;
        }
      }else if(op==='inc') prev++; else if(op==='dec') prev--;
    }
    return out;
  }
  decode(bits: number[], K=0): number[]{
    if(bits.length===0) return [];
    const out:number[]=[];
    let idx=0;
    let firstVal:number;
    if(bits.length>=4 && bits[0]===1 && bits[1]===1 && bits[2]===1 && bits[3]===0){
      idx=4;
      const res=decodeOneFibAt(bits, idx);
      if(!res) return [];
      const q=res.val; idx=res.end;
      const rBits=Math.ceil(Math.log2(K));
      const r=bitsToInt(bits.slice(idx, idx+rBits));
      idx+=rBits;
      firstVal=q*K+r;
    }else{
      const first=decodeOneFibAt(bits,0);
      if(!first) return [];
      firstVal=first.val; idx=first.end;
    }
    out.push(firstVal); let prev=firstVal;
    const n=bits.length;
    while(idx<n){
      let node=this.trie; let op: string|null=null;
      while(idx<n){ const b=bits[idx]; if(!(b in node)) break; node=node[b]; idx++; if('_op' in node){ op=node['_op']; break; } }
      if(!op) break;
      if(op==='repeat') out.push(prev);
      else if(op==='inc'){ prev++; out.push(prev); }
      else if(op==='dec'){ prev--; out.push(prev); }
      else{
        let v:number;
        if(K>1 && idx+4<=n && bits[idx]===1 && bits[idx+1]===1 && bits[idx+2]===1 && bits[idx+3]===0){
          idx+=4;
          const res=decodeOneFibAt(bits, idx);
          if(!res) break;
          const q=res.val; idx=res.end;
          const rBits=Math.ceil(Math.log2(K));
          const r=bitsToInt(bits.slice(idx, idx+rBits)); idx+=rBits;
          v=q*K+r;
        }else{
          const res=decodeOneFibAt(bits, idx);
          if(!res) break;
          v=res.val; idx=res.end;
        }
        out.push(v); prev=v;
      }
    }
    return out;
  }
}

class BlackjackV2{
  encode(values: number[]){
    if(values.length===0) return {bits:[] as number[], variant:'C' as const, K:0, len:0};
    const maxV=Math.max(...values);
    const K = maxV>5000 ? 1024 : maxV>2000 ? 256 : 0;
    const variants: ('C'|'E'|'I')[]=['C','E','I'];
    let best={bits:[] as number[], variant:'C' as any, K:0, len:Infinity};
    for(const varnt of variants){
      const codec=new BlackjackBase(varnt);
      const bits=codec.encode(values, K);
      if(bits.length < best.len) best={bits, variant:varnt, K, len:bits.length};
    }
    const rawBitsNeeded = maxV<65536 ? 16 : 32;
    const rawLen = 2 + rawBitsNeeded*values.length;
    if(rawLen < best.len){
      const bits:number[]=[1,0];
      for(const v of values) bits.push(...intToBits(v, rawBitsNeeded));
      return {bits, variant:'RAW' as any, K:0, len:bits.length};
    }
    const header = best.variant==='C' ? [0,0] : best.variant==='E' ? [0,1] : [1,1];
    return {bits:[...header, ...best.bits], variant:best.variant, K:best.K, len:best.len+2};
  }
  decode(bits: number[]): number[]{
    if(bits.length<2) return [];
    const h0=bits[0], h1=bits[1];
    if(h0===1 && h1===0){
      const rawBits = bits.length>2+16*2 ? 32 : 16;
      const out:number[]=[];
      let idx=2;
      while(idx+rawBits<=bits.length){ out.push(bitsToInt(bits.slice(idx, idx+rawBits))); idx+=rawBits; }
      return out;
    }
    const variant = h0===0 && h1===0 ? 'C' : h0===0 && h1===1 ? 'E' : 'I';
    const rest=bits.slice(2);
    for(const K of [1024,256,0]){
      const codec=new BlackjackBase(variant as any);
      const dec=codec.decode(rest, K);
      if(dec.length>0) return dec;
    }
    return [];
  }
}

function packBits(bits: number[]): Uint8Array{
  const byteLen=Math.ceil(bits.length/8);
  const out=new Uint8Array(byteLen+4);
  const view=new DataView(out.buffer);
  view.setUint32(0, bits.length, true);
  for(let i=0;i<bits.length;i++) if(bits[i]) out[4+(i>>3)] |= (1<<(i&7));
  return out;
}
function unpackBits(data: Uint8Array): number[]{
  const view=new DataView(data.buffer, data.byteOffset, data.byteLength);
  const bitLen=view.getUint32(0,true);
  const bits:number[]=[];
  for(let i=0;i<bitLen;i++) bits.push((data[4+(i>>3)]>>(i&7))&1);
  return bits;
}

function encodeTimestamps(tss: number[]): number[]{
  if(tss.length===0) return [];
  if(tss.length===1) return [tss[0]];
  const deltas:number[]=[];
  let prev=tss[0];
  for(let i=1;i<tss.length;i++){ deltas.push(tss[i]-prev); prev=tss[i]; }
  const dod:number[]=[tss[0], deltas[0]];
  for(let i=1;i<deltas.length;i++) dod.push(deltas[i]-deltas[i-1]);
  return dod.map(v => v>=0 ? v*2 : (-v)*2-1);
}
function decodeTimestamps(dod: number[]): number[]{
  if(dod.length===0) return [];
  if(dod.length===1) return [dod[0]];
  const unzig = dod.map(v => v%2===0 ? v/2 : -( (v+1)/2 ));
  const tss:number[]=[unzig[0]];
  let delta=unzig[1];
  tss.push(tss[0]+delta);
  for(let i=2;i<unzig.length;i++){ delta+=unzig[i]; tss.push(tss[tss.length-1]+delta); }
  return tss;
}

interface Block { tPacked: Uint8Array, vPacked: Uint8Array, count: number, minTs: number, maxTs: number }
function keyStr(name: string, tags: Record<string,string>): string { return name + "|" + Object.entries(tags).sort().map(function(p){return p[0]+"="+p[1]}).join(","); }

class MemoryBackend {
  blocks = new Map<string, Block[]>();
  async append(key: string, block: Block){ if(!this.blocks.has(key)) this.blocks.set(key,[]); this.blocks.get(key)!.push(block); }
  async getBlocks(key: string){ return this.blocks.get(key)||[]; }
}

class IndexedDBBackend {
  dbName='shard-tsdb';
  async append(key: string, block: Block){
    const all = JSON.parse(localStorage.getItem(this.dbName) || '{}');
    if(!all[key]) all[key]=[];
    all[key].push({t:Array.from(block.tPacked), v:Array.from(block.vPacked), count:block.count, minTs:block.minTs, maxTs:block.maxTs});
    localStorage.setItem(this.dbName, JSON.stringify(all));
  }
  async getBlocks(key: string): Promise<Block[]>{
    try{
      const all = JSON.parse(localStorage.getItem(this.dbName) || '{}');
      const arr = all[key]||[];
      return arr.map((b:any)=>({tPacked: new Uint8Array(b.t), vPacked: new Uint8Array(b.v), count:b.count, minTs:b.minTs, maxTs:b.maxTs}));
    }catch{ return []; }
  }
}

export class ShardTSDB {
  backend: MemoryBackend|IndexedDBBackend;
  blockSize: number;
  buffers = new Map<string, {tss:number[], vals:number[]}>();
  codec = new BlackjackV2();
  constructor(opts:{backend?:'memory'|'indexeddb', blockSize?:number}={}){
    this.blockSize=opts.blockSize||1024;
    this.backend = opts.backend==='indexeddb' ? new IndexedDBBackend() : new MemoryBackend();
  }
  async put(name: string, tags: Record<string,string>, ts: number, val: number){
    await this.putBatch(name, tags, [ts], [val]);
  }
  async putBatch(name: string, tags: Record<string,string>, tss: number[], vals: number[]){
    const k=keyStr(name, tags);
    if(!this.buffers.has(k)) this.buffers.set(k,{tss:[], vals:[]});
    const buf=this.buffers.get(k)!;
    buf.tss.push(...tss);
    buf.vals.push(...vals);
    while(buf.tss.length>=this.blockSize){
      const btss=buf.tss.slice(0,this.blockSize);
      const bvals=buf.vals.slice(0,this.blockSize);
      buf.tss=buf.tss.slice(this.blockSize);
      buf.vals=buf.vals.slice(this.blockSize);
      await this.flushBlock(k, btss, bvals);
    }
  }
  private async flushBlock(key: string, tss: number[], vals: number[]){
    const dod=encodeTimestamps(tss);
    const tBits=this.codec.encode(dod).bits;
    const vBits=this.codec.encode(vals.map(v=> Math.round(v))).bits;
    const block: Block = { tPacked: packBits(tBits), vPacked: packBits(vBits), count:tss.length, minTs:tss[0], maxTs:tss[tss.length-1] };
    await this.backend.append(key, block);
  }
  async flushAll(){
    for(const [k,buf] of this.buffers.entries()){
      if(buf.tss.length>0){
        await this.flushBlock(k, buf.tss, buf.vals);
        buf.tss=[]; buf.vals=[];
      }
    }
  }
  async range(name: string, tags: Record<string,string>, start: number, end: number): Promise<{tss:number[], vals:number[]}>{
    await this.flushAll();
    const k=keyStr(name, tags);
    const blocks=await this.backend.getBlocks(k);
    const outT:number[]=[]; const outV:number[]=[];
    for(const b of blocks){
      if(b.maxTs < start || b.minTs > end) continue;
      const tBits=unpackBits(b.tPacked);
      const vBits=unpackBits(b.vPacked);
      const dod=this.codec.decode(tBits);
      const tss=decodeTimestamps(dod);
      const vals=this.codec.decode(vBits);
      for(let i=0;i<tss.length;i++){
        if(tss[i]>=start && tss[i]<=end){ outT.push(tss[i]); outV.push(vals[i]); }
      }
    }
    return {tss:outT, vals:outV};
  }
  async last(name: string, tags: Record<string,string>, n: number){
    await this.flushAll();
    const k=keyStr(name, tags);
    const blocks=await this.backend.getBlocks(k);
    const allT:number[]=[]; const allV:number[]=[];
    for(const b of blocks){
      const tBits=unpackBits(b.tPacked);
      const vBits=unpackBits(b.vPacked);
      const dod=this.codec.decode(tBits);
      const tss=decodeTimestamps(dod);
      const vals=this.codec.decode(vBits);
      allT.push(...tss); allV.push(...vals);
    }
    const start=Math.max(0, allT.length-n);
    return {tss: allT.slice(start), vals: allV.slice(start)};
  }
  async stats(name: string, tags: Record<string,string>){
    const k=keyStr(name, tags);
    const blocks=await this.backend.getBlocks(k);
    let totalPoints=0; let totalBytes=0;
    for(const b of blocks){ totalPoints+=b.count; totalBytes+=b.tPacked.length+b.vPacked.length; }
    return {blocks:blocks.length, points: totalPoints, bytes: totalBytes, avgBitsPerPoint: totalPoints? (totalBytes*8/totalPoints) : 0 };
  }
}

export { BlackjackV2, BlackjackBase as BlackjackCodec };
