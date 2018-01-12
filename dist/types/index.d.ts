export declare const ROOT_SCOPE: string;
declare const _default: {
    registerScope: (name?: string, initScope?: any) => string;
    registerAction: (scopeId: string, action: (scope: any, props: any, resolved: (newScope: any) => void) => void) => string;
    dispatch: (actionId: string, props: any) => Promise<{}>;
    subscribe: (scopeId: string, listener: (event: {
        newScope: any;
        oldScope: any;
        actionId: string;
    }) => void) => string;
    unsubscribe: (listenerId: string) => void;
    getScope: (scopeId: string) => any;
    getState: () => {
        [x: string]: any;
    };
};
export default _default;
