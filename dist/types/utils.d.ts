export declare function uniqueId(name?: string): string;
export declare function keys(object: Object): string[];
export declare function values<T>(obj: {
    [key: string]: T;
}): T[];
export declare function deepFreeze<T>(obj: T): Readonly<T>;
