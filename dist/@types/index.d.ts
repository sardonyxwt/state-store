/**
 * @type ScopeConfig
 * @summary Scope configuration
 * @param {string} name The name of scope.
 * @default Generate unique name.
 * @param {any} initState The initial scope state.
 * @default Empty object.
 * @param {ScopeMiddleware[]} middleware The scope middleware.
 * @description You can use middleware to use aspect programing.
 * @default Empty array.
 * @param {boolean} isSubscribeMacroAutoCreateEnable Is create subscribe macro when register action.
 * @default false.
 * @param {boolean} isImmutabilityEnabled Is use deepFreeze for state and action props.
 * @default false.
 * @param {boolean} isFrozen Is scope frozen.
 * @default false.
 */
export declare type ScopeConfig<T> = {
    name?: string;
    initState?: T;
    middleware?: ScopeMiddleware<T>[];
    isSubscribedMacroAutoCreateEnabled?: boolean;
    isImmutabilityEnabled?: boolean;
    isFrozen?: boolean;
};
/**
 * @type StoreConfig
 * @summary Store configuration
 * @param {string} name The name of scope.
 * @param {boolean} isFrozen Is store frozen.
 * @default false.
 */
export declare type StoreConfig = {
    name: string;
    isFrozen?: boolean;
};
export declare type ScopeEvent<T = any> = {
    newState: T;
    oldState: T;
    scopeName: string;
    storeName: string;
    actionName: string;
    props: any;
    parentEvent?: ScopeEvent<T>;
    childrenEvents?: ScopeEvent<T>[];
};
export declare type ScopeError<T = any> = {
    reason: any;
    oldState: T;
    scopeName: string;
    actionName: string;
    props: any;
};
export declare type ScopeListenerUnsubscribeCallback = (() => boolean) & {
    listenerId: string;
};
export declare type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export declare type ScopeAction<T, PROPS> = (state: T, props?: PROPS) => T;
export declare type ScopeMacro<T, PROPS, OUT> = (state: T, props?: PROPS) => OUT;
export declare type ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT> = (actionResult: T, props: PROPS) => TRANSFORMED_OUT;
export declare type ScopeActionDispatcher<T, PROPS, OUT> = (props?: PROPS, emitEvent?: boolean) => OUT;
export declare enum ScopeMacroType {
    GETTER = "GETTER",
    SETTER = "SETTER",
    FUNCTION = "FUNCTION"
}
/**
 * @interface Scope
 * @summary The whole state of your app is stored in an scopes.
 */
export interface Scope<T = any> {
    /**
     * @var name.
     * @summary Scope name.
     * @description Name unique for scope.
     */
    readonly name: string;
    /**
     * @var state
     * @summary Scope state.
     */
    readonly state: T;
    /**
     * @var context
     * @summary Scope action current context.
     */
    readonly context: T;
    /**
     * @var store
     * @summary Scope parent store.
     */
    readonly store: Store;
    /**
     * @var isLocked
     * @summary Is locked status.
     */
    readonly isLocked: boolean;
    /**
     * @var isActionDispatchAvailable
     * @summary Is action dispatch available status.
     */
    readonly isActionDispatchAvailable: boolean;
    /**
     * @var isSubscribedMacroAutoCreateEnabled
     * @summary Is subscribe macro auto create enabled.
     */
    readonly isSubscribedMacroAutoCreateEnabled: boolean;
    /**
     * @var supportActions
     * @summary Support actions.
     */
    readonly supportActions: string[];
    /**
     * @function registerAction
     * @summary Registers a new action in scope.
     * @param {string} actionName The action name.
     * @param {ScopeAction} action The action that changes the state of scope.
     * @param {ScopeActionResultTransformer} transformer The transformer change returned result.
     * @return {ScopeActionDispatcher} Return action dispatcher.
     * You can use it to dispatch action without call scope.dispatch.
     * @throws {Error} Will throw an error if the scope locked or action name exists in scope
     * when it is called.
     */
    registerAction<PROPS, TRANSFORMED_OUT = T>(actionName: string, action: ScopeAction<T, PROPS>, transformer?: ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT>): ScopeActionDispatcher<T, PROPS, TRANSFORMED_OUT>;
    /**
     * @function registerMacro
     * @summary Registers a new macro in scope.
     * @param {string} macroName The transformer name.
     * @param {ScopeMacro} macro The transformer used to add getter macros to scope.
     * @param {ScopeMacroType} macroType Register macro type.
     * @throws {Error} Will throw an error if the scope locked or macro name exists in scope
     * when it is called.
     */
    registerMacro<PROPS, OUT>(macroName: string, macro: ScopeMacro<T, PROPS, OUT>, macroType?: ScopeMacroType): any;
    /**
     * @function dispatch
     * @summary Dispatches an action.
     * @description Dispatches an action is the only way to trigger a scope change.
     * @param {string} actionName Triggered action with same name.
     * @description This action change state of scope and return new state.
     * You can use resolve to change the state or reject to throw an exception.
     * @param {any?} props Additional data for the correct operation of the action.
     * @param {boolean?} emitEvent You can specify emit event or not.
     * @return {any extends T} Return new state.
     * @throws {Error} Will throw an error if the actionName not present in scope
     * or {isActionDispatchAvailable} is false.
     */
    dispatch(actionName: string, props?: any, emitEvent?: boolean): T;
    /**
     * @function subscribe
     * @summary Adds a scope change listener.
     * @description It will be called any time an action is dispatched.
     * @param {ScopeListener} listener A callback to be invoked on every dispatch.
     * @param {string[]} actionNames Specific actions to subscribe.
     * @return {ScopeListenerUnsubscribeCallback} A listener unsubscribe callback to remove this change listener later.
     * @throws {Error} Will throw an error if actionName not present in scope.
     */
    subscribe(listener: ScopeListener<T>, actionNames?: string[]): ScopeListenerUnsubscribeCallback;
    /**
     * @function unsubscribe
     * @summary Removes a scope change listener.
     * @param {string} id Id of the listener to delete.
     * @return {boolean} Status of unsubscribe action.
     */
    unsubscribe(id: string): boolean;
    /**
     * @function lock
     * @summary Prevents the addition of new actions to scope.
     */
    lock(): void;
    /**
     * @function reset
     * @summary Reset scope state.
     */
    reset(): void;
}
/**
 * @interface ScopeMiddleware
 * @summary You can use middleware to use aspect programing.
 */
export interface ScopeMiddleware<T> {
    /**
     * @function postSetup
     * @param {Scope} scope Created scope.
     * @summary You can use this method to setup custom actions in scope or
     * subscribe to actions in scope. Lock scope in this point is bad practice.
     */
    postSetup(scope: Scope<T>): void;
    /**
     * @function appendActionMiddleware
     * @summary This method wraps the action with a new action and returns it.
     * @param {ScopeAction} action Wrapped action.
     * @return {ScopeAction} Action that wrapped old action
     */
    appendActionMiddleware<PROPS>(action: ScopeAction<T, PROPS>): ScopeAction<T, PROPS>;
}
export declare enum ScopeChangeEventType {
    REGISTER_MACRO = "REGISTER_MACRO",
    REGISTER_ACTION = "REGISTER_ACTION",
    LOCK = "LOCK"
}
export declare enum StoreChangeEventType {
    CREATE_SCOPE = "CREATE_SCOPE",
    LOCK = "LOCK"
}
export interface ScopeChangeDetails {
    type: ScopeChangeEventType;
    actionName?: string;
    macroName?: string;
    macroType?: ScopeMacroType;
}
export interface StoreChangeDetails {
    type: StoreChangeEventType;
    scopeName?: string;
}
/**
 * @interface StoreDevTool
 * @summary You can use StoreDevTool to handle all action in store.
 */
export interface StoreDevTool {
    /**
     * @function onCreateStore
     * @summary Call when created new store.
     * @param {Store} store Created store.
     */
    onCreateStore(store: Store): void;
    /**
     * @function onChangeStore
     * @summary Call when change store (lock, createScope).
     * @param {Scope} store Changed store.
     * @param {ScopeChangeDetails} details Additional store change details.
     */
    onChangeStore(store: Store, details: StoreChangeDetails): void;
    /**
     * @function onCreateScope
     * @summary Call when created new scope.
     * @param {Scope} scope Created scope.
     */
    onCreateScope(scope: Scope): void;
    /**
     * @function onChangeScope
     * @summary Call when change scope (lock, registerAction, dispatch).
     * @param {Scope} scope Changed scope.
     * @param {ScopeChangeDetails} details Additional scope change details.
     */
    onChangeScope(scope: Scope, details: ScopeChangeDetails): void;
    /**
     * @function onAction
     * @summary Call when in any scope dispatch action.
     * @param {ScopeEvent} event Action event.
     */
    onAction(event: ScopeEvent): void;
    /**
     * @function onActionError
     * @summary Call when in any scope dispatch action error.
     * @param {ScopeError} error Action error.
     */
    onActionError(error: ScopeError): void;
    /**
     * @function onActionListenerError
     * @summary Call when in any scope listener dispatch error.
     * @param {ScopeError} error ActionListener error.
     */
    onActionListenerError(error: ScopeError): void;
}
/**
 * @interface Store
 * @summary The whole state of your app is stored in an scopes inside a store.
 */
export interface Store {
    /**
     * @var name.
     * @summary Store name.
     * @description Name unique for store.
     */
    readonly name: string;
    /**
     * @var isLocked
     * @summary Is locked status.
     */
    readonly isLocked: boolean;
    /**
     * @var state
     * @summary Store state.
     */
    readonly state: {
        [scopeName: string]: any;
    };
    /**
     * @function createScope
     * @summary Create a new scope and return it.
     * @param {ScopeConfig} config The config of scope.
     * @return {Scope} Scope.
     * @throws {Error} Will throw an error if name of scope not unique.
     */
    createScope<T = any>(config?: ScopeConfig<T>): Scope<T>;
    /**
     * @function getScope
     * @summary Returns scope.
     * @param {string} scopeName Name scope, to get the Scope.
     * @return {Scope} Scope or null
     */
    getScope<T = any>(scopeName: string): Scope<T>;
    /**
     * @function hasScope
     * @summary Returns a boolean indicating whether an Scope with the specified name exists or not in Store.
     * @param {string} scopeName Name of scope, to check scope in store.
     * @return {boolean} Exist status
     */
    hasScope(scopeName: string): boolean;
    /**
     * @function lock
     * @summary Prevents the creation of new scope to store and lock all included scopes.
     */
    lock(): void;
    /**
     * @function reset
     * @summary Reset scopes state.
     */
    reset(): void;
}
/**
 * @function isStoreExist
 * @summary Check is store exist.
 * @param {string} storeName Name of store.
 * @return {boolean} Status of store exist.
 */
export declare function isStoreExist(storeName: string): boolean;
/**
 * @function createStore
 * @summary Create a new store and return it.
 * @param {StoreConfig} config Name of store.
 * @return {Store} Store.
 * @throws {Error} Will throw an error if name of store not unique.
 */
export declare function createStore(config: StoreConfig): Store;
/**
 * @function getStore
 * @summary Returns store.
 * @param {string} storeName Name scope, to get the Scope.
 * @return {Store} Store or null
 */
export declare function getStore(storeName: string): Store;
/**
 * @function getState
 * @summary Returns all store states.
 * @return {{string: {string: any}}} Scope states
 */
export declare function getState(): {};
/**
 * @function setStoreDevTool
 * @summary Set store dev tool.
 * @param {StoreDevTool} devTool Dev tool middleware, to handle store changes.
 */
export declare function setStoreDevTool(devTool: Partial<StoreDevTool>): void;
