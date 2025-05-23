export abstract class Singleton<T> {
  protected static instance: any;

  protected constructor() {}

  public static getInstance<T>(this: new () => T): T {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }
} 