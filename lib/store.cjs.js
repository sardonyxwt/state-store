'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const generateSalt = (length = 16, sample = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    while (result.length < length) {
        result += sample.charAt(Math.floor(Math.random() * sample.length));
    }
    return result;
};
const generateUUID = () => `${generateSalt(4)}-${generateSalt(4)}-${generateSalt(4)}-${generateSalt(4)}`;
const createUniqueIdGenerator = (prefix) => {
    let index = 0;
    const uuid = generateUUID();
    const uniquePrefix = `${prefix}:${uuid}`;
    return () => `${uniquePrefix}:${++index}`;
};

function deepFreeze(obj) {
    Object.getOwnPropertyNames(obj).forEach(function (key) {
        let prop = obj[key];
        if (typeof prop === 'object' && prop !== null) {
            deepFreeze(prop);
        }
    });
    return Object.freeze(obj);
}

(function (ScopeMacroType) {
    ScopeMacroType["GETTER"] = "GETTER";
    ScopeMacroType["SETTER"] = "SETTER";
    ScopeMacroType["FUNCTION"] = "FUNCTION";
})(exports.ScopeMacroType || (exports.ScopeMacroType = {}));
(function (ScopeChangeEventType) {
    ScopeChangeEventType["REGISTER_MACRO"] = "REGISTER_MACRO";
    ScopeChangeEventType["REGISTER_ACTION"] = "REGISTER_ACTION";
    ScopeChangeEventType["LOCK"] = "LOCK";
})(exports.ScopeChangeEventType || (exports.ScopeChangeEventType = {}));
(function (StoreChangeEventType) {
    StoreChangeEventType["CREATE_SCOPE"] = "CREATE_SCOPE";
    StoreChangeEventType["LOCK"] = "LOCK";
})(exports.StoreChangeEventType || (exports.StoreChangeEventType = {}));
const stores = new Map();
const storeDevTool = {
    onCreateStore: () => null,
    onChangeStore: () => null,
    onCreateScope: () => null,
    onChangeScope: () => null,
    onAction: () => null,
    onActionError: () => null,
    onActionListenerError: () => null
};
const RESET_SCOPE_ACTION = '_reset';
const RESTORE_SCOPE_ACTION = '_restore';
class ScopeImpl {
    constructor(store, config) {
        this._context = null;
        this._contextEvent = null;
        this._isActionInProgress = false;
        this._actions = new Map();
        this._listeners = new Map();
        this._listenerIdGenerator = createUniqueIdGenerator('ScopeListener');
        const { name, initState, middleware, isImmutabilityEnabled, isSubscribedMacroAutoCreateEnabled, isFrozen } = config;
        this.store = store;
        this.name = name;
        this.isImmutabilityEnabled = isImmutabilityEnabled;
        this.isSubscribedMacroAutoCreateEnabled = isSubscribedMacroAutoCreateEnabled;
        this._state = initState;
        this._initState = initState;
        // This code needed to save middleware correct order in dispatch method.
        this._middleware = [...middleware].reverse();
        this.registerAction(RESET_SCOPE_ACTION, () => this._initState);
        this.registerAction(RESTORE_SCOPE_ACTION, (_, restoredState) => {
            this._initState = restoredState;
            return restoredState;
        });
        this._isFrozen = isFrozen;
    }
    get isLocked() {
        return this._isFrozen;
    }
    get isActionDispatchAvailable() {
        return !this._isActionInProgress;
    }
    get state() {
        return this._state;
    }
    get context() {
        return this._context;
    }
    get supportActions() {
        return Array.from(this._actions.keys());
    }
    registerAction(actionName, action, transformer) {
        if (this._isFrozen) {
            throw new Error(`This scope is locked you can't add new action.`);
        }
        if (this._actions.has(actionName) || (this.isSubscribedMacroAutoCreateEnabled && actionName in this)) {
            throw new Error(`Action name ${actionName} is duplicate or reserved in scope ${this.name}.`);
        }
        this._actions.set(actionName, action);
        const actionDispatcher = (props, emitEvent) => {
            const dispatchResult = this.dispatch(actionName, props, emitEvent);
            return transformer ? transformer(dispatchResult, props) : dispatchResult;
        };
        if (this.isSubscribedMacroAutoCreateEnabled) {
            const capitalizeFirstLetterActionName = () => {
                return actionName.charAt(0).toUpperCase() + actionName.slice(1);
            };
            const subscriberMacroName = `on${capitalizeFirstLetterActionName()}`;
            this.registerMacro(subscriberMacroName, (state, listener) => {
                return this.subscribe(listener, [actionName]);
            });
        }
        this[actionName] = actionDispatcher;
        storeDevTool.onChangeScope(this, { type: exports.ScopeChangeEventType.REGISTER_ACTION, actionName });
        return actionDispatcher;
    }
    registerMacro(macroName, macro, macroType = exports.ScopeMacroType.FUNCTION) {
        if (!macro) {
            throw new Error(`Macro cannot be null or undefined.`);
        }
        if (this._isFrozen) {
            throw new Error(`This scope is locked you can't add new macro.`);
        }
        const isMacroExist = macroName in this;
        const isPresentMacroHasFunctionType = () => typeof this[macroName] === 'function';
        if (isMacroExist
            && (isPresentMacroHasFunctionType()
                || macroType === exports.ScopeMacroType.FUNCTION
                || (macroType === exports.ScopeMacroType.GETTER && Object.getOwnPropertyDescriptor(this, macroName).get)
                || (macroType === exports.ScopeMacroType.SETTER && Object.getOwnPropertyDescriptor(this, macroName).set))) {
            throw new Error(`Macro name ${macroName} is reserved in scope ${this.name}.`);
        }
        const macroFunc = (props) => {
            return macro(this._state, props);
        };
        switch (macroType) {
            case exports.ScopeMacroType.FUNCTION:
                this[macroName] = macroFunc;
                break;
            case exports.ScopeMacroType.GETTER:
                Object.defineProperty(this, macroName, { get: macroFunc, configurable: true, enumerable: true });
                break;
            case exports.ScopeMacroType.SETTER:
                Object.defineProperty(this, macroName, { set: macroFunc, configurable: true, enumerable: true });
                break;
        }
        storeDevTool.onChangeScope(this, { type: exports.ScopeChangeEventType.REGISTER_MACRO, macroName, macroType });
    }
    dispatch(actionName, props, emitEvent = true) {
        let action = this._actions.get(actionName);
        if (!action) {
            throw new Error(`This action not exists ${actionName}`);
        }
        if (this._isActionInProgress) {
            throw new Error('Now action dispatch not available. Other action spreads.');
        }
        if (this.isImmutabilityEnabled && !!props && typeof props === 'object') {
            deepFreeze(props);
        }
        this._middleware.forEach(middleware => action = middleware.appendActionMiddleware(action));
        const isRootAction = !this._isActionInProgress;
        if (isRootAction) {
            this._isActionInProgress = true;
        }
        const oldState = isRootAction ? this._state : this._context;
        const buildScopeError = (reason) => ({
            reason,
            oldState,
            scopeName: this.name,
            actionName,
            props
        });
        const buildScopeEvent = (newState) => {
            var _a;
            return ({
                props,
                oldState,
                newState,
                actionName,
                parentEvent: (_a = this._contextEvent) !== null && _a !== void 0 ? _a : null,
                scopeName: this.name,
                storeName: this.store.name,
                childrenEvents: []
            });
        };
        const onFulfilled = newState => {
            if (this.isImmutabilityEnabled && !!newState && typeof props === 'object') {
                deepFreeze(newState);
            }
            this._context = newState;
            if (emitEvent) {
                isRootAction
                    ? this._contextEvent = buildScopeEvent(newState)
                    : this === null || this === void 0 ? void 0 : this._contextEvent.childrenEvents.push(buildScopeEvent(newState));
            }
            const dispatchEvent = (event) => {
                storeDevTool.onAction(event);
                this._listeners.forEach(listener => {
                    try {
                        listener === null || listener === void 0 ? void 0 : listener(event);
                    }
                    catch (reason) {
                        storeDevTool.onActionListenerError(buildScopeError(reason));
                    }
                });
            };
            if (isRootAction) {
                this._state = newState;
                if (this._contextEvent) {
                    this._contextEvent.childrenEvents.forEach(dispatchEvent);
                    dispatchEvent(this._contextEvent);
                }
                this._context = null;
                this._contextEvent = null;
                this._isActionInProgress = false;
            }
            return newState;
        };
        const onRejected = reason => {
            const error = buildScopeError(reason);
            if (isRootAction) {
                storeDevTool.onActionError(error);
            }
            return error;
        };
        try {
            return onFulfilled(action(oldState, props));
        }
        catch (e) {
            throw onRejected(e);
        }
    }
    subscribe(listener, actionNames = []) {
        actionNames.forEach(actionName => {
            if (!this._actions.has(actionName)) {
                throw new Error(`Action (${actionName}) not present in scope.`);
            }
        });
        const listenerId = this._listenerIdGenerator();
        const accurateListener = event => {
            const isActionPresentInScope = actionNames.findIndex(actionName => actionName === event.actionName) !== -1;
            if (isActionPresentInScope) {
                listener(event);
            }
        };
        this._listeners.set(listenerId, actionNames.length === 0 ? listener : accurateListener);
        return Object.assign(() => this.unsubscribe(listenerId), { listenerId });
    }
    unsubscribe(id) {
        return this._listeners.delete(id);
    }
    lock() {
        this._isFrozen = true;
        storeDevTool.onChangeScope(this, { type: exports.ScopeChangeEventType.LOCK });
    }
    reset(emitEvent) {
        return this.dispatch(RESET_SCOPE_ACTION, null, emitEvent);
    }
    restore(restoredState, emitEvent) {
        return this.dispatch(RESTORE_SCOPE_ACTION, restoredState, emitEvent);
    }
}
class StoreImpl {
    constructor(config) {
        this._scopes = new Map();
        this._statesToRestore = new Map();
        this._scopeNameGenerator = createUniqueIdGenerator('Scope');
        this.name = config.name;
        this._isFrozen = config.isFrozen;
    }
    get isLocked() {
        return this._isFrozen;
    }
    get state() {
        const state = {};
        this._scopes.forEach(scope => {
            state[scope.name] = scope.state;
        });
        return state;
    }
    createScope(config = {}, useRestoredStateIfAvailable) {
        if (this._isFrozen) {
            throw new Error(`This Store is locked you can't add new scope.`);
        }
        const { name = this._scopeNameGenerator(), initState = null, middleware = [], isImmutabilityEnabled = false, isSubscribedMacroAutoCreateEnabled = false, isFrozen = false } = config;
        if (this._scopes.has(name)) {
            throw new Error(`Scope name must unique`);
        }
        const useRestoredState = useRestoredStateIfAvailable && this._statesToRestore.has(name);
        const state = useRestoredState
            ? this._statesToRestore.get(name)
            : initState;
        if (useRestoredState) {
            this._statesToRestore.delete(name);
        }
        let scope = new ScopeImpl(this, {
            name,
            initState: state,
            middleware: middleware,
            isImmutabilityEnabled,
            isSubscribedMacroAutoCreateEnabled,
            isFrozen
        });
        this._scopes.set(name, scope);
        middleware.forEach(middleware => middleware.postSetup(scope));
        storeDevTool.onCreateScope(scope);
        storeDevTool.onChangeStore(this, { type: exports.StoreChangeEventType.CREATE_SCOPE, scopeName: name });
        return scope;
    }
    getScope(scopeName) {
        return this._scopes.get(scopeName);
    }
    hasScope(scopeName) {
        return this._scopes.has(scopeName);
    }
    lock() {
        this._isFrozen = true;
        this._scopes.forEach(it => it.lock());
        storeDevTool.onChangeStore(this, { type: exports.StoreChangeEventType.LOCK });
    }
    reset(emitEvent) {
        this._scopes.forEach(scope => scope.reset(emitEvent));
    }
    restore(restoredStates, emitEvent) {
        Object.getOwnPropertyNames(restoredStates).forEach(restoredScopeName => {
            const restoredState = restoredStates[restoredScopeName];
            this.hasScope(restoredScopeName)
                ? this.getScope(restoredScopeName).restore(restoredState, emitEvent)
                : this._statesToRestore.set(restoredScopeName, restoredState);
        });
    }
}
/**
 * @function isStoreExist
 * @summary Check is store exist.
 * @param {string} storeName Name of store.
 * @return {boolean} Status of store exist.
 */
function isStoreExist(storeName) {
    return stores.has(storeName);
}
/**
 * @function createStore
 * @summary Create a new store and return it.
 * @param {StoreConfig} config Name of store.
 * @return {Store} Store.
 * @throws {Error} Will throw an error if name of store not unique.
 */
function createStore(config) {
    const { name, isFrozen = false } = config;
    if (isStoreExist(name)) {
        throw new Error('Store name must unique');
    }
    const store = new StoreImpl({ name, isFrozen });
    stores.set(name, store);
    storeDevTool.onCreateStore(store);
    return store;
}
/**
 * @function getStore
 * @summary Returns store.
 * @param {string} storeName Name scope, to get the Scope.
 * @return {Store} Store or null
 */
function getStore(storeName) {
    return stores.get(storeName);
}
/**
 * @function getState
 * @summary Returns all store states.
 * @return {{string: {[key: string]: any}}} Scope states
 */
function getState() {
    const state = {};
    stores.forEach(store => {
        state[store.name] = store.state;
    });
    return state;
}
/**
 * @function setStoreDevTool
 * @summary Set store dev tool.
 * @param {StoreDevTool} devTool Dev tool middleware, to handle store changes.
 */
function setStoreDevTool(devTool) {
    Object.assign(storeDevTool, devTool);
}

exports.RESET_SCOPE_ACTION = RESET_SCOPE_ACTION;
exports.RESTORE_SCOPE_ACTION = RESTORE_SCOPE_ACTION;
exports.createStore = createStore;
exports.getState = getState;
exports.getStore = getStore;
exports.isStoreExist = isStoreExist;
exports.setStoreDevTool = setStoreDevTool;
