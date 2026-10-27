import { murmurhash3_32 } from "./murmur3.js";

export interface PRNG {
  next(): number;
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  pickWeighted<T>(items: readonly { item: T; weight: number }[]): T;
  sample<T>(items: readonly T[], count: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  boolean(chance?: number): boolean;
  hex(chars?: number): string;
  digits(count?: number): string;
  fork(subKey: string | number): PRNG;
  getState(): number;
  setState(state: number): void;
}

export function createMulberry32(initialSeed: number): PRNG {
  let s = initialSeed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function nextFloat(min: number, max: number): number {
    return next() * (max - min) + min;
  }

  function pick<T>(items: readonly T[]): T {
    if (!items || items.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    return items[Math.floor(next() * items.length)];
  }

  function pickWeighted<T>(items: readonly { item: T; weight: number }[]): T {
    let total = 0;
    for (let i = 0; i < items.length; i++) total += items[i].weight;
    let r = next() * total;
    for (let i = 0; i < items.length; i++) {
      if (r < items[i].weight) return items[i].item;
      r -= items[i].weight;
    }
    return items[items.length - 1].item;
  }

  function sample<T>(items: readonly T[], count: number): T[] {
    const copy = [...items];
    const res: T[] = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(next() * copy.length);
      res.push(copy.splice(idx, 1)[0]);
    }
    return res;
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function boolean(chance = 0.5): boolean {
    return next() < chance;
  }

  function hex(chars = 8): string {
    let out = "";
    for (let i = 0; i < chars; i++) {
      out += Math.floor(next() * 16).toString(16);
    }
    return out;
  }

  function digits(count = 4): string {
    let out = "";
    for (let i = 0; i < count; i++) {
      out += Math.floor(next() * 10).toString();
    }
    return out;
  }

  function fork(subKey: string | number): PRNG {
    const subSeed = (s + (typeof subKey === "number" ? subKey : murmurhash3_32(String(subKey)))) | 0;
    return createMulberry32(subSeed);
  }

  return {
    next,
    nextInt,
    nextFloat,
    pick,
    pickWeighted,
    sample,
    shuffle,
    boolean,
    hex,
    digits,
    fork,
    getState: () => s,
    setState: (state: number) => { s = state | 0; }
  };
}
