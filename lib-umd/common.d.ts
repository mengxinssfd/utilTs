/**
 * 防抖函数
 * @param callback 回调
 * @param delay 延时
 * @returns {Function}
 */
export declare function debounce<CB extends (...args: any[]) => void>(callback: CB, delay: number): CB;
/**
 * 如果callback执行了的话，那么不论是否resolved都不会再被reject
 * @param callback
 * @param delay
 */
export declare function debounceAsync<T, CB extends (...args: any[]) => Promise<T>>(callback: CB, delay: number): CB;
/**
 * 可取消防抖函数
 * @param callback 回调
 * @param delay 延时
 * @returns {Function}
 */
export declare function debounceCancelable(callback: (...args: any[]) => void, delay: number): (...args: any[]) => () => void;
/**
 * 前一个promise未完成即reject，最后一个或者中断前调用的才会执行
 * 无法阻止cb被调用 不推荐使用
 * @param callback
 */
export declare function debounceByPromise<T, CB extends (...args: any[]) => Promise<T>>(callback: CB): CB;
/**
 * 轮询函数
 * @param callback
 * @param interval  间隔
 * @param immediate 是否马上执行第一次
 */
export declare function polling(callback: (times: number) => void | Promise<any>, interval: number, immediate?: boolean): () => void;
export declare function forEachByLen(len: number, callback: (index: number) => (any | false)): void;
export declare function typeOf(target: any): string;
export declare function randomNumber(): number;
export declare function randomNumber(end: number): number;
export declare function randomNumber(start: number, end: number): number;
export declare function randomNumber(start: number, end: number, length: number): number[];
/**
 * 随机颜色
 */
export declare function randomColor(): string;
export declare function randomColor(len: number): string[];
/**
 * 千位分隔 1,234,567,890
 * @param num
 */
export declare function thousandFormat(num: string | number): string;
export declare function getFormatStr(str: any, ...params: any[]): any;
/**
 * 给长度不满足要求的字符串添加前缀 strFillPrefix
 * @param target
 * @param len
 * @param fill
 */
export declare function strPadStart(target: string, len: number, fill: string): string;
/**
 * 给长度不满足要求的字符串添加后缀 strFillPrefix
 * @param target
 * @param len
 * @param fill
 */
export declare function strPadEnd(target: string, len: number, fill: string): string;
/**
 * 每隔一段事件返回字符串中的一个单词
 * @param words
 * @param delay
 * @param callback
 */
export declare function oneByOne(words: string, delay: number, callback?: (word: string, index: number, words: string) => false | void): () => void;
export interface Number2Chinese {
    (number: number): string;
    units: string[];
    numbers: string[];
}
/**
 * 阿拉伯数字转为中文数字
 * @param number
 */
export declare const number2Chinese: Number2Chinese;
export interface Chinese2Number {
    (chineseNumber: string): number;
    units: string[];
    numbers: string[];
}
/**
 * 中文转为阿拉伯数字
 * @param chineseNumber
 */
export declare const chinese2Number: Chinese2Number;
export declare function generateFunctionCode(argsArrayLength: number): string;
export declare function generateFunction(obj: object, property: string, args: any[]): any;
export declare function getTreeMaxDeep(tree: object): number;
export declare function getTreeNodeLen(tree: object, nodeNumber?: number): number;
export declare function merge<T extends object, U extends object>(first: T, second: U): T & U;
export declare function deepMerge<T extends object, U extends object>(first: T, second: U): T & U;
export declare function sleep(delay: number): Promise<void>;
/**
 * 生成不重复的字符串
 * @param length
 * @returns {string}
 */
export declare function createUUID(length: number): string;
/**
 * 格式化json
 * @param json
 * @param indent tab空格占位
 */
export declare function formatJSON(json: object | string, indent?: number): string;
export declare function createEnum<T extends string>(items: T[]): {
    [k in T]: number;
} & {
    [k: number]: T;
};
export declare function createEnumByObj<T extends object, K extends keyof T, O extends {
    [k: string]: K;
}>(obj: T): T & {
    [k: string]: K;
};
/**
 * @param originObj
 * @param pickKeys
 * @param cb
 */
export declare function pickByKeys<T extends object, K extends keyof T, O extends Pick<T, K>>(originObj: T, pickKeys: K[], cb?: (value: T[K], key: K, originObj: T) => Pick<T, K>[K]): Pick<T, K>;
export declare function pickRename<T extends object, K extends keyof T, O extends {
    [k: string]: K;
}>(originObj: T, renamePickObj: O, cb?: (value: T[O[keyof O]], key: O[keyof O], originObj: T) => T[O[keyof O]]): {
    [k in keyof O]: T[O[k]];
};
/**
 * 功能与pickByKeys函数一致
 * @param originObj
 * @param pickKeys
 * @param cb
 */
export declare function pick<T extends object, K extends keyof T, KS extends K[]>(originObj: T, pickKeys: KS, cb?: (value: T[K], key: K, fromObj: T) => T[K]): {
    [key in K]: T[key];
};
/**
 * 功能与pickRename函数一致
 * @param originObj
 * @param renamePickObj
 * @param cb
 */
export declare function pick<T extends object, K extends keyof T, O extends {
    [k: string]: K;
}>(originObj: T, renamePickObj: O, cb?: (value: T[O[keyof O]], key: O[keyof O], fromObj: T) => T[O[keyof O]]): {
    [k in keyof O]: T[O[k]];
};
/**
 * Omit 省略
 * @example
 *  // returns {c: true}
 *  omit({a: 123, b: "bbb", c: true}, ["a", "b"])
 * @param target
 * @param keys
 */
export declare function omit<T extends object, K extends keyof T>(target: T, keys: readonly K[]): Omit<T, K>;
/**
 * object key-value翻转
 * @param obj
 */
export declare function getReverseObj(obj: {
    [k: string]: string;
}): {
    [k: string]: string;
};
export declare function promiseAny<T>(list: Promise<T>[]): Promise<T>;
/**
 * 代替Object.keys(obj).forEach，减少循环次数
 * @param obj
 * @param callbackFn 返回false的时候中断
 */
export declare function forEachObj<T extends object>(obj: T, callbackFn: (value: T[keyof T], key: keyof T, obj: T) => (void | false)): void;
/**
 * 代替Object.keys(obj).reduce，减少循环次数
 * @param obj
 * @param callbackFn
 * @param initialValue 初始值
 */
export declare function reduceObj<T extends object, R>(obj: T, callbackFn: (previousValue: R, value: T[keyof T], key: keyof T, obj: T) => R, initialValue: R): R;
export declare function assign<T, U>(target: T, source: U): T & U;
export declare function assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export declare function assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export declare function assign(target: object, ...args: object[]): any;
