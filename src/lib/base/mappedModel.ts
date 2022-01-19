import type CacheableModel from "./cacheableModel";
import WritableModel from "./writableModel";

/**
 * A base for writable models that contain mapped data.
 */
export abstract class MappedModel<Key, Value, Entry extends MappedModelEntry<Key, Value>> extends WritableModel {
  private readonly _entryMap: Map<number, Entry>;
  private readonly _keyMap: Map<number | string, number>;
  private _nextId: number;
  private _cachedEntries?: Entry[];

  /**
   * An iterable of the entries in this model. Note that mutating this iterable
   * will not update the model, but mutating individual entries will.
   */
  get entries(): Entry[] {
    return this._cachedEntries ??= [...this._entryMap.values()];
  }

  /**
   * The number of entries in this model.
   */
  get size(): number {
    return this._entryMap.size;
  }

  protected constructor(entries: { key: Key; value: Value; }[], options?: {
    buffer?: Buffer;
    owner?: CacheableModel;
  }) {
    super(options);
    this._entryMap = new Map();
    this._keyMap = new Map();

    entries.forEach((entry, id) => {
      this._entryMap.set(id, this._makeEntry(entry.key, entry.value));
      this._keyMap.set(this._getKeyIdentifier(entry.key), id);
    });

    this._nextId = this.size;
  }

  //#region Overridden Public Methods

  uncache(): void {
    this.resetEntries();
    super.uncache();
  }

  //#endregion Overridden Public Methods

  //#region Public Methods

  /**
   * Creates a new entry with the given key and value, adds it to this model,
   * and returns it.
   * 
   * @param key Key of entry
   * @param value Value of entry
   * @returns The entry object that was created
   */
  add(key: Key, value: Value): Entry {
    const id = this._nextId++;
    if (this._entryMap.has(id))
      throw new Error(`Duplicated ID in mapped model: ${id}`);
    const entry = this._makeEntry(key, value);
    this._entryMap.set(id, entry);
    this._keyMap.set(this._getKeyIdentifier(key), id);
    this.uncache();
    return entry;
  }

  /**
   * Creates new entries for the give key/value pairs, adds them to this model,
   * and returns them in an array.
   * 
   * @param entries List of objects to add as entries
   * @returns An array of the entries that were created
   */
  addAll(entries: { key: Key; value: Value; }[]): Entry[] {
    return entries.map(entry => this.add(entry.key, entry.value));
  }

  /**
   * Removes all entries from this model.
   */
  clear() {
    if (this.size > 0) {
      this._entryMap.clear();
      this._keyMap.clear();
      this._nextId = 0;
      this.uncache();
    }
  }

  /**
   * Removes an entry from this model by its unique ID.
   * 
   * @param id ID of the entry to remove
   * @returns True if an entry was removed, false otherwise
   */
  delete(id: number): boolean {
    const entry = this._entryMap.get(id);
    
    if (entry) {
      this._entryMap.delete(id);
      this._keyMap.delete(this._getKeyIdentifier(entry.key));
      this.uncache();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Removes the first entry from this model that has the given key.
   * 
   * @param key Key of the entry to remove
   * @returns True if an entry was removed, false otherwise
   */
  deleteByKey(key: Key): boolean {
    return this.delete(this.getIdForKey(key));
  }

  /**
   * Finds all keys that belong to more than one entry and returns them in an
   * array.
   * 
   * @returns Array of all repeated keys
   */
  findRepeatedKeys(): Key[] {
    const keys: Key[] = [];

    if (this._entryMap.size !== this._keyMap.size) {
      const seenKeys = new Set();
      this._entryMap.forEach(entry => {
        const keyId = this._getKeyIdentifier(entry.key);
        if (seenKeys.has(keyId)) {
          keys.push(entry.key);
        } else {
          seenKeys.add(keyId);
        }
      });
    }

    return keys;
  }

  /**
   * Returns the entry that has the given ID, or undefined if there isn't one.
   * 
   * @param id ID of entry to retrieve
   */
  get(id: number): Entry {
    return this._entryMap.get(id);
  }

  /**
   * Returns the first entry that has the given key, or undefined if there
   * aren't any.
   * 
   * @param key Key of entry to retrieve
   */
  getByKey(key: Key): Entry {
    return this.get(this.getIdForKey(key));
  }

  /**
   * Returns the ID of the first entry that has the given key. If there are no
   * entries with the given key, undefined is returned.
   * 
   * @param key Key to get IDs for
   */
  getIdForKey(key: Key): number {
    return this._keyMap.get(this._getKeyIdentifier(key));
  }

  /**
   * Returns an array of the IDs for every entry that has the given key.
   * Ideally, the result will always have one number, however, keys are not
   * guaranteed to be unique. If there are no entries with the given key, an
   * empty array is returned.
   * 
   * @param key Key to get IDs for
   */
  getIdsForKey(key: Key): number[] {
    const ids: number[] = [];

    for (const [ id, entry ] of this._entryMap) {
      if (entry.keyEquals(key)) ids.push(id);
    }

    return ids;
  }

  /**
   * Checks whether this model has an entry with the given key.
   * 
   * @param key Key to check
   * @returns True if there is an entry with the given key, false otherwise
   */
  hasKey(key: Key): boolean {
    return this.getIdForKey(key) !== undefined;
  }

  /**
   * Notifies this model that a key has been updated.
   * 
   * @param previous Previous key
   * @param current New key
   */
  _onKeyUpdate(previous: Key, current: Key) {
    const previousIdentifier = this._getKeyIdentifier(previous);
    const id = this._keyMap.get(previousIdentifier);
    this._keyMap.delete(previousIdentifier);
    this._keyMap.set(this._getKeyIdentifier(current), id);
    this.uncache();
  }

  /**
   * Resets the `entries` property of this model, so that a new array will be
   * created the next time it is used.
   */
  resetEntries() {
    delete this._cachedEntries;
  }

  //#endregion Public Methods

  //#region Protected Methods

  /**
   * Returns a unique value that represents the given key compared to other
   * keys of its type.
   * 
   * @param key Key to get unique identifier for
   */
  protected abstract _getKeyIdentifier(key: Key): number | string;

  /**
   * Creates a new entry to add to this model.
   * 
   * @param key Key of entry
   * @param value Value of entry
   */
  protected abstract _makeEntry(key: Key, value: Value): Entry;

  //#endregion Protected Methods
}

/**
 * An entry in a MappedModel. This entry is responsible for notifying the owner
 * when its key or value updates.
 */
export interface MappedModelEntry<Key, Value> {
  owner?: MappedModel<Key, Value, MappedModelEntry<Key, Value>>;

  /** The key for this entry. */
  key: Key;

  /** The value of this entry. */
  value: Value;

  /**
   * Checks if the given key is equal to the one that this entry uses.
   * 
   * @param key Key to check for equality
   * @returns True if the keys are equal, false otherwise
   */
  keyEquals(key: Key): boolean;
}
