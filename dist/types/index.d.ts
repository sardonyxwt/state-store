import { ActionType, ListenerType } from './types';
export declare const ROOT_SCOPE: string;
export declare function registerScope(name?: string, initScope?: any): string;
export declare function registerAction(scopeId: string, action: ActionType): string;
export declare function dispatch(actionId: string, props: any): Promise<{}>;
export declare function subscribe(scopeId: string, listener: ListenerType): string;
export declare function unsubscribe(listenerId: string): void;
export declare function getScope(scopeId: string): any;
export declare function getState(): {
    [x: string]: any;
};
