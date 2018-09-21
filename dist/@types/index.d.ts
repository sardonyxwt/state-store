export declare type ScopeEvent<T = any> = {
    newState: T;
    oldState: T;
    scopeName: string;
    actionName: string;
    props;
};
export declare type ScopeError<T = any> = {
    reason;
    oldState: T;
    scopeName: string;
    actionName: string;
    props;
};
export declare type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export declare type ScopeAction<T, P = any> = (state: T, props: P, resolve: (newState: T) => void, reject: (error) => void) => void;
export declare type ScopeActionDispatcher<T, P = any> = (props: P) => Promise<T>;
/**
 * @interface Scope
 * @summary The whole state of your app is stored in an scopes inside a single store.
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
     * @var isLocked
     * @summary Is locked status.
     */
    readonly isLocked: boolean;
    /**
     * @var supportActions
     * @summary Returns support actions.
     */
    readonly supportActions: string[];
    /**
     * @function registerAction
     * @summary Registers a new action in scope.
     * @param {string} name The action name.
     * @param {ScopeAction} action The action that changes the state of scope.
     * @return {ScopeActionDispatcher} Return action dispatcher.
     * You can use it to dispatch action without call scope.dispatch.
     * @throws {Error} Will throw an error if the scope locked or action name exists in scope
     * when it is called.
     */
    registerAction<P>(name: string, action: ScopeAction<T, P>): ScopeActionDispatcher<T, P>;
    /**
     * @function dispatch
     * @summary Dispatches an action.
     * @description Dispatches an action is the only way to trigger a scope change.
     * @param {string} actionName Triggered action with same name.
     * @description This action change state of scope and return new state.
     * You can use resolve to change the state or reject to throw an exception.
     * @param {any?} props Additional data for the correct operation of the action.
     * @return {Promise} Return promise.
     * You can use it to get a new state of scope or catch errors.
     * @throws {Error} Will throw an error if the actionName not present in scope.
     */
    dispatch(actionName: string, props?: any): Promise<T>;
    /**
     * @function subscribe
     * @summary Adds a scope change listener.
     * @description It will be called any time an action is dispatched.
     * @param {ScopeListener} listener A callback to be invoked on every dispatch.
     * @param {string | string[]} actionName Specific action to subscribe.
     * @return {string} A listener id to remove this change listener later.
     * @throws {Error} Will throw an error if actionName not present in scope.
     */
    subscribe(listener: ScopeListener<T>, actionName?: string | string[]): string;
    /**
     * @function unsubscribe
     * @summary Removes a scope change listener.
     * @param {string} id Id of the listener to delete.
     * @return {boolean} Status of unsubscribe action.
     */
    unsubscribe(id: string): boolean;
    /**
     * @function synchronize
     * @summary Adds a scope synchronized listener.
     * @description Synchronized listener will be called any time an action is dispatched.
     * @param {object} object Object to synchronized.
     * @param {string} key Object property key for synchronized.
     * If not specific use Object.getOwnPropertyNames to synchronize all properties.
     * @param {string} actionName Specific action to synchronize.
     * @return {string} A listener id to remove this change listener later.
     * @throws {Error} Will throw an errors:
     * - if actionName not present in scope.
     * - if {key} param not specified and state isn`t object.
     */
    synchronize(object: object, key: string, actionName?: string): string;
    /**
     * @function lock
     * @summary Prevents the addition of new actions to scope.
     */
    lock(): void;
}
/**
 * @interface ScopeMiddleware
 * @summary You can use middleware to use aspect programing.
 */
export interface ScopeMiddleware<T = any> {
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
    appendActionMiddleware(action: ScopeAction<T>): ScopeAction<T>;
}
/**
 * @interface StoreDevTool
 * @summary You can use StoreDevTool to handle all action in store.
 */
export interface StoreDevTool {
    /**
     * @function onCreate
     * @summary Call when created new scope.
     * @param {Scope} scope Created scope.
     */
    onCreate(scope: Scope): void;
    /**
     * @function onChange
     * @summary Call when change scope (lock, registerAction, dispatch).
     * @param {Scope} scope Changed scope.
     */
    onChange(scope: Scope): void;
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
}
/**
 * @function createScope
 * @summary Create a new scope and return it.
 * @param {string} name The name of scope.
 * @default Generate unique name.
 * @param {any} initState The initial scope state.
 * @default Empty object.
 * @param {ScopeMiddleware[]} middleware The scope middleware.
 * @description You can use middleware to use aspect programing.
 * @default Empty array.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export declare function createScope<T>(name?: string, initState?: T, middleware?: ScopeMiddleware<T>[]): Scope<T>;
/**
 * @function composeScope
 * @summary Compose a new scope and return it.
 * @description Compose a new scope and return it. All scopes is auto lock.
 * @param {string} name The name of scope
 * @param {(Scope | string)[]} scopes Scopes to compose.
 * @description Length must be greater than one
 * @param {ScopeMiddleware[]} middleware The scope middleware.
 * @description You can use middleware to use aspect programing.
 * @default Empty array.
 * @return {Scope} Compose scope.
 * @throws {Error} Will throw an error if scopes length less fewer than two.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export declare function composeScope(name: string, scopes: (Scope | string)[], middleware?: ScopeMiddleware[]): Scope;
/**
 * @function getScope
 * @summary Returns scope.
 * @param {string} scopeName Name scope, to get the Scope.
 * @return {Scope} Scope
 * @throws {Error} Will throw an error if scope not present.
 */
export declare function getScope(scopeName: string): Scope<any>;
/**
 * @function getState
 * @summary Returns all scope states.
 * @return {{string: any}} Scope states
 */
export declare function getState(): {};
/**
 * @function setStoreDevTool
 * @summary Set store dev tool.
 * @param {StoreDevTool} devTool Dev tool middleware, to handle store changes.
 */
export declare function setStoreDevTool(devTool: StoreDevTool): void;
/**
 * @var ROOT_SCOPE
 * @summary This scope is global
 * @type {Scope}
 */
export declare const ROOT_SCOPE: Scope<{}>;
