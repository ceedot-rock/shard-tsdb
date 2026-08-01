declare class BlackjackBase {
    codes: Record<string, number[]>;
    trie: any;
    variant: string;
    constructor(variant: 'C' | 'E' | 'I' | 'G');
    encode(values: number[], K?: number): number[];
    decode(bits: number[], K?: number): number[];
}
declare class BlackjackV2 {
    encode(values: number[]): {
        bits: number[];
        variant: any;
        K: number;
        len: number;
    };
    decode(bits: number[]): number[];
}
interface Block {
    tPacked: Uint8Array;
    vPacked: Uint8Array;
    count: number;
    minTs: number;
    maxTs: number;
}
declare class MemoryBackend {
    blocks: Map<string, Block[]>;
    append(key: string, block: Block): Promise<void>;
    getBlocks(key: string): Promise<Block[]>;
}
declare class IndexedDBBackend {
    dbName: string;
    append(key: string, block: Block): Promise<void>;
    getBlocks(key: string): Promise<Block[]>;
}
export declare class ShardTSDB {
    backend: MemoryBackend | IndexedDBBackend;
    blockSize: number;
    buffers: Map<string, {
        tss: number[];
        vals: number[];
    }>;
    codec: BlackjackV2;
    constructor(opts?: {
        backend?: 'memory' | 'indexeddb';
        blockSize?: number;
    });
    put(name: string, tags: Record<string, string>, ts: number, val: number): Promise<void>;
    putBatch(name: string, tags: Record<string, string>, tss: number[], vals: number[]): Promise<void>;
    private flushBlock;
    flushAll(): Promise<void>;
    range(name: string, tags: Record<string, string>, start: number, end: number): Promise<{
        tss: number[];
        vals: number[];
    }>;
    last(name: string, tags: Record<string, string>, n: number): Promise<{
        tss: number[];
        vals: number[];
    }>;
    stats(name: string, tags: Record<string, string>): Promise<{
        blocks: number;
        points: number;
        bytes: number;
        avgBitsPerPoint: number;
    }>;
}
export { BlackjackV2, BlackjackBase as BlackjackCodec };
