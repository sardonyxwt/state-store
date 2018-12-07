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
 * @param {boolean} isFrozen Is scope frozen.
 * @default false.
 */
export declare type ScopeConfig<T> = {
    name?;
    initState?: T;
    middleware?: ScopeMiddleware<T>[];
    isSubscribeMacroAutoCreateEnable?: boolean;
    isFrozen?: boolean;
};
export declare type ScopeEvent<T = any> = {
    newState: T;
    oldState: T;
    scopeName: string;
    actionName: string;
    props;
    parentEvent?: ScopeEvent<T>;
    childrenEvents?: ScopeEvent<T>[];
};
export declare type ScopeError<T = any> = {
    reason;
    oldState: T;
    scopeName: string;
    actionName: string;
    props;
};
export declare type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export declare type ScopeAction<T, PROPS> = (state: T, props?: PROPS) => T;
export declare type ScopeMacro<T, PROPS, OUT> = (state: T, props?: PROPS) => OUT;
export declare type ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT> = (actionResult: T, props: PROPS) => TRANSFORMED_OUT;
export declare type ScopeActionDispatcher<T, PROPS, OUT> = (props?: PROPS, context?: T) => OUT;
export declare enum ScopeMacroType {
    GETTER = "GETTER",
    SETTER = "SETTER",
    FUNCTION = "FUNCTION",
}
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
     * @var context
     * @summary Scope action current context.
     */
    readonly context: T;
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
     * @var isSubscribeMacroAutoCreateEnable
     * @summary Is subscribe macro auto create enable.
     */
    readonly isSubscribeMacroAutoCreateEnable: boolean;
    /**
     * @var supportActions
     * @summary Returns support actions.
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
    LOCK = "LOCK",
}
export interface ScopeChangeDetails {
    type: ScopeChangeEventType;
    actionName?: string;
    macroName?: string;
    macroType?: ScopeMacroType;
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
     * @param {ScopeChangeDetails} details Additional scope change details.
     */
    onChange(scope: Scope, details: ScopeChangeDetails): void;
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
 * @function createScope
 * @summary Create a new scope and return it.
 * @param {ScopeConfig} config The config of scope.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export declare function createScope<T>(config?: ScopeConfig<T>): Scope<T>;
/**
 * @function composeScope
 * @summary Compose a new scope and return it.
 * @description Compose a new scope and return it. All scopes is auto lock.
 * @return {Scope} Compose scope.
 * @throws {Error} Will throw an error if scopes length less fewer than two.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export declare function composeScope<T = {}>(scopes: (Scope | string)[], config?: ScopeConfig<T>): Scope<T>;
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
export declare function setStoreDevTool(devTool: Partial<StoreDevTool>): void;
