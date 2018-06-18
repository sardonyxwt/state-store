export declare type Listener<T> = (event: {
    newState: T;
    oldState: T;
    actionName: string;
}) => void;
export declare type Action<T> = (state: T, props, resolve: (newState: T) => void, reject: (error) => void) => void;
export interface Scope<T = any> {
    /**
     * @var Scope name
     */
    readonly name: string;
    /**
     * Registers a new action in scope.
     * @param {string} name The action name.
     * @param {Action} action The action that changes the state of scope
     * @throws {Error} Will throw an error if the scope locked or action name exists in scope
     * when it is called.
     */
    registerAction(name: string, action: Action<T>): void;
    /**
     * Dispatches an action. It is the only way to trigger a scope change.
     * @param {string} actionName Triggered action with same name.
     * This action change state of scope and return new state.
     * You can use resolve to change the state or reject to throw an exception.
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
     * Adds a scope synchronized listener.
     * It will be called any time an action is dispatched.
     * @param {object} object Object to synchronized.
     * @param {string} key Object property key for synchronized.
     * @param {string} actionName Specific action to synchronize.
     * @return {string} A listener id to remove this change listener later.
     * @throws {Error} Will throw an error if actionName not present in scope.
     */
    synchronize(object: object, key: string, actionName?: string): string;
    /**
     * Prevents the addition of new actions to scope.
     */
    lock(): void;
    /**
     * Check is locked status.
     * @return Is locked status.
     */
    isLocked(): boolean;
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
