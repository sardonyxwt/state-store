export declare const ROOT_SCOPE: string;
declare const _default: {
    registerScope: (name?: string, initScope?: {}) => string;
    registerAction: (action: (scope: any, props: any, resolved: (newScope: any) => void, rejected: (error: any) => void) => void, scopeId?: string) => string;
    dispatch: (actionId: string, props?: any) => Promise<{}>;
    subscribe: (listener: (event: {
        newScope: any;
        oldScope: any;
        actionId: string;
    }) => void, scopeId?: string) => string;
    unsubscribe: (listenerId: string) => void;
    getScope: (scopeId?: string) => any;
    getState: () => {
        [x: string]: any;
    };
};
export default _default;
