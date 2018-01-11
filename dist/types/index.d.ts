export declare type ListenerType = (event: {
    newScope: any;
    oldScope: any;
}) => void;
export declare type ActionType = (scope: any, props: any, resolved: (newScope: any) => void) => void;
export declare type Action = {
    scopeId: string;
    func: ActionType;
};
export declare type Listener = {
    actionId: string;
    func: ListenerType;
};
export declare class Store {
    private static scopes;
    private static actions;
    private static listeners;
    static scope(scopeId: string, initScope?: any): string;
    static action(scopeId: string, action: ActionType): string;
    static dispatch(actionId: string, props: any): void;
    static subscribe(actionId: string, listener: ListenerType): string;
    static unsubscribe(listenerId: string): void;
    static getState(): any;
}
export declare const ROOT_SCOPE: string;
export default Store;
