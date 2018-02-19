export declare type Listener<T> = (event: {
    newScope: T;
    oldScope: T;
    actionName: string;
    props;
}) => void;
export declare type Action<T> = (scope: T, props, resolve: (newScope: T) => void, reject: (error) => void) => void;
export interface Scope<T = any> {
    /**
     * Scope name.
     * Name unique for scope.
     */
    readonly name: string;
    /**
     * Registers a new action in scope.
     * @param {string} name The action name.
     * @param {Action} action The action that changes the scope
     * @throws {Error} Will throw an error if the scope frozen or action name exists in scope
     * when it is called.
     */
    registerAction(name: string, action: Action<T>): void;
    /**
     * Dispatches an action. It is the only way to trigger a scope change.
     * @param {string} actionName Triggered action with same name.
     * This action change scope and return new scope.
     * You can use resolve to change the scope or reject to throw an exception.
     * @param {any?} props Additional data for the correct operation of the action.
     * @return {Promise<>} You can use the promise to get a new state of scope
     * or catch errors.
     * @throws {Error} Will throw an error if the actionName not present in scope.
     */
    dispatch(actionName: string, props?: any): Promise<T>;
    /**
     * Adds a scope change listener.
     * It will be called any time an action is dispatched.
     * @param {Listener} listener A callback to be invoked on every dispatch.
     * @param {string} actionName Specific action to subscribe.
     * @return {string} A listener id to remove this change listener later.
     * @throws {Error} Will throw an error if actionName not present in scope.
     */
    subscribe(listener: Listener<T>, actionName?: string): string;
    /**
     * Removes a scope change listener.
     * @param {string} id Id of the listener to delete.
     */
    unsubscribe(id: string): boolean;
    /**
     * Prevents the addition of new actions to scope.
     */
    freeze(): void;
    /**
     * Returns scope state.
     * @return Scope state.
     */
    getState(): T;
}
/**
 * Create a new scope and return it.
 * @param {string} name The name of scope
 * By default generate unique name
 * @param {any} initState The initial scope state.
 * By default use empty object.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export declare function createScope<T>(name?: string, initState?: T): Scope<T>;
/**
 * Returns scope.
 * @param {string} scopeName Name scope, to get the Scope.
 * @return {Scope} Scope
 */
export declare function getScope(scopeName: any): Scope<any>;
/**
 * Returns all scope states.
 * @return {{string: any}} Scope states
 */
export declare function getState(): {};
/**
 * This scope is global
 * @type {Scope}
 */
export declare const ROOT_SCOPE: Scope<{}>;
