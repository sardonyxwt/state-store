export declare function uniqueId(name?: string): string;
export declare function deepFreeze<T>(obj: T): Readonly<T>;
export declare function keys(object: Object): string[];
export declare function values<T>(object: {
    [key: string]: T;
}): T[];
