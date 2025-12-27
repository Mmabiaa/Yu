import { MemoryCache, CacheEntry, CachePolicy } from '../../types/cache';

interface LRUNode<T> {
  key: string;
  value: T;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
  timestamp: Date;
  ttl?: number;
  size: number;
  accessCount: number;
  lastAccessed: Date;
}

export class MemoryCacheImpl implements MemoryCache {
  private cache = new Map<string, LRUNode<any>>();
  private head: LRUNode<any> | null = null;
  private tail: LRUNode<any> | null = null;
  private currentSize = 0;
  private policy: CachePolicy;

  constructor(policy: CachePolicy) {
    this.policy = policy;
  }

  get<T>(key: string): T | null {
    const node = this.cache.get(key);
    if (!node) {
      return null;
    }

    // Check TTL
    if (this.isExpired(node)) {
      this.delete(key);
      return null;
    }

    // Update access info
    node.accessCount++;
    node.lastAccessed = new Date();

    // Move to head (most recently used)
    this.moveToHead(node);

    return node.value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const existingNode = this.cache.get(key);
    const size = this.calculateSize(value);
    const now = new Date();

    if (existingNode) {
      // Update existing node
      this.currentSize -= existingNode.size;
      existingNode.value = value;
      existingNode.size = size;
      existingNode.timestamp = now;
      existingNode.lastAccessed = now;
      existingNode.ttl = ttl || this.policy.ttl;
      existingNode.accessCount++;
      this.currentSize += size;
      this.moveToHead(existingNode);
    } else {
      // Create new node
      const newNode: LRUNode<T> = {
        key,
        value,
        prev: null,
        next: null,
        timestamp: now,
        ttl: ttl || this.policy.ttl,
        size,
        accessCount: 1,
        lastAccessed: now,
      };

      // Check if we need to evict
      while (
        (this.cache.size >= this.policy.maxEntries || 
         this.currentSize + size > this.policy.maxSize) &&
        this.tail
      ) {
        this.evictLRU(1);
      }

      this.cache.set(key, newNode);
      this.currentSize += size;
      this.addToHead(newNode);
    }
  }

  delete(key: string): void {
    const node = this.cache.get(key);
    if (!node) {
      return;
    }

    this.cache.delete(key);
    this.currentSize -= node.size;
    this.removeNode(node);
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentSize = 0;
  }

  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    if (this.isExpired(node)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  getSize(): number {
    return this.currentSize;
  }

  getEntryCount(): number {
    return this.cache.size;
  }

  evictLRU(count = 1): void {
    let evicted = 0;
    while (evicted < count && this.tail) {
      const key = this.tail.key;
      this.delete(key);
      evicted++;
    }
  }

  cleanup(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (this.isExpired(node)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  // Get all entries (for debugging/testing)
  getAllEntries(): CacheEntry[] {
    const entries: CacheEntry[] = [];
    for (const [key, node] of this.cache.entries()) {
      entries.push({
        key,
        value: node.value,
        timestamp: node.timestamp,
        ttl: node.ttl,
        size: node.size,
        accessCount: node.accessCount,
        lastAccessed: node.lastAccessed,
      });
    }
    return entries;
  }

  private isExpired(node: LRUNode<any>): boolean {
    if (!node.ttl) {
      return false;
    }
    const now = new Date();
    const expiryTime = new Date(node.timestamp.getTime() + node.ttl * 1000);
    return now > expiryTime;
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size for non-serializable objects
    }
  }

  private addToHead(node: LRUNode<any>): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<any>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: LRUNode<any>): void {
    this.removeNode(node);
    this.addToHead(node);
  }
}