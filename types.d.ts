interface IPerseverantOptions<TSerializer = typeof JSON> {
  /**
   * Name of the storage. Default is `'global'`
   * Hightly suggested to use non-default name
   */
  name?: string;
  /**
   * Name of storage folder. Default is `'HOME/.perseverant'`
   */
  folder?: string;
  /**
   * Serializer / Derserializer. Default is `JSON`
   */
  serializer?: TSerializer;
}

declare class Perseverant {

  /**
   * 
   * @param instanceNameOrOptions name or instance options of Perseverant instance. Can be omitted entirely to set default values for everything
   */
  createInstance(instanceNameOrOptions?: string | IPerseverantOptions): Perseverant;

  /**
   * retrieve a key (read key file)
   */
  getItem<T, TCallbackReturn>(key: string, callback: (item: T | null) => TCallbackReturn): Promise<TCallbackReturn>;
  /**
   * retrieve a key (read key file)
   */
  getItem<T = any>(key: string): Promise<T | null>;

  /**
   * store a key (write key file)
   */
  setItem<T, TCallbackReturn>(key: string, value: T, callback: (savedItem: T) => TCallbackReturn): Promise<TCallbackReturn>;
  /**
   * store a key (write key file)
   */
  setItem<T>(key: string, value: T): Promise<T>;

  /**
   * remove a key (unlink key file)
   */
  removeItem<TCallbackReturn>(key: string, callback: () => TCallbackReturn): Promise<TCallbackReturn>;
  /**
   * remove a key (unlink key file)
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * clear all keys for the named storage (rm -rf folder and its files)
   * WARNING: if you call this on global name, it'll clean it all
   */
  clear(): Promise<void>;
  /**
   * clear all keys for the named storage (rm -rf folder and its files)
   * WARNING: if you call this on global name, it'll clean it all
   */
  clear<T>(callback?: () => T): Promise<T>;

  /**
   * returns the length of keys
   */
  length(callback?: () => any): Promise<number>;

  /**
   * returns all keys
   */
  keys<TCallbackReturn>(callback: (files: string[]) => TCallbackReturn): Promise<TCallbackReturn>;
  /**
   * returns all keys
   */
  keys(): Promise<string[]>;
}

export = Perseverant;
