import {deepFreeze} from '@sardonyxwt/utils/object';
import {createUniqueIdGenerator} from '@sardonyxwt/utils/generator';

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
export type ScopeConfig<T> = {
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
export type StoreConfig = {
  name: string;
  isFrozen?: boolean;
};
export type ScopeEvent<T = any> = {
  newState: T;
  oldState: T;
  scopeName: string;
  storeName: string;
  actionName: string;
  props;
  parentEvent?: ScopeEvent<T>;
  childrenEvents?: ScopeEvent<T>[];
};
export type ScopeError<T = any> = {
  reason;
  oldState: T;
  scopeName: string;
  actionName: string;
  props;
};
export type ScopeListenerUnsubscribeCallback = (() => boolean) & {listenerId: string};
export type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export type ScopeAction<T, PROPS> = (state: T, props?: PROPS) => T;
export type ScopeMacro<T, PROPS, OUT> = (state: T, props?: PROPS) => OUT;
export type ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT> = (actionResult: T, props: PROPS) => TRANSFORMED_OUT;
export type ScopeActionDispatcher<T, PROPS, OUT> = (props?: PROPS, emitEvent?: boolean) => OUT;

export enum ScopeMacroType {
  GETTER = 'GETTER',
  SETTER = 'SETTER',
  FUNCTION = 'FUNCTION',
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
  registerAction<PROPS, TRANSFORMED_OUT = T>(
    actionName: string,
    action: ScopeAction<T, PROPS>,
    transformer?: ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT>
  ): ScopeActionDispatcher<T, PROPS, TRANSFORMED_OUT>;

  /**
   * @function registerMacro
   * @summary Registers a new macro in scope.
   * @param {string} macroName The transformer name.
   * @param {ScopeMacro} macro The transformer used to add getter macros to scope.
   * @param {ScopeMacroType} macroType Register macro type.
   * @throws {Error} Will throw an error if the scope locked or macro name exists in scope
   * when it is called.
   */
  registerMacro<PROPS, OUT>(
    macroName: string,
    macro: ScopeMacro<T, PROPS, OUT>,
    macroType?: ScopeMacroType
  );

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
  dispatch(actionName: string, props?, emitEvent?: boolean): T;

  /**
   * @function subscribe
   * @summary Adds a scope change listener.
   * @description It will be called any time an action is dispatched.
   * @param {ScopeListener} listener A callback to be invoked on every dispatch.
   * @param {string | string[]} actionName Specific action to subscribe.
   * @return {ScopeListenerUnsubscribeCallback} A listener unsubscribe callback to remove this change listener later.
   * @throws {Error} Will throw an error if actionName not present in scope.
   */
  subscribe(listener: ScopeListener<T>, actionName?: string | string[]): ScopeListenerUnsubscribeCallback;

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

export enum ScopeChangeEventType {
  REGISTER_MACRO = 'REGISTER_MACRO',
  REGISTER_ACTION = 'REGISTER_ACTION',
  LOCK = 'LOCK'
}

export enum StoreChangeEventType {
  CREATE_SCOPE = 'CREATE_SCOPE',
  LOCK = 'LOCK'
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
  readonly state: { [scopeName: string]: any };

  /**
   * @var scopes
   * @summary Store scopes.
   */
  readonly scopes: string[];

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
   * @return {Scope} Scope
   * @throws {Error} Will throw an error if scope not present.
   */
  getScope<T = any>(scopeName: string): Scope<T>;

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

const stores: Store[] = [];
const storeDevTool: StoreDevTool = {
  onCreateStore: () => null,
  onChangeStore: () => null,
  onCreateScope: () => null,
  onChangeScope: () => null,
  onAction: () => null,
  onActionError: () => null,
  onActionListenerError: () => null
};

class ScopeImpl<T> implements Scope<T> {

  private readonly _name: string;
  private readonly _initState: T;
  private _state: T;
  private _context: T;
  private _store: Store;
  private _isFrozen: boolean;
  private _isActionInProgress: boolean = false;
  private _isActionDispatchAvailable: boolean = true;
  private readonly _isImmutabilityEnabled: boolean;
  private readonly _isSubscribedMacroAutoCreateEnabled: boolean;
  private _middleware: ScopeMiddleware<T>[];
  private _actions: { [key: string]: ScopeAction<T, any> } = {};
  private _listeners: { [key: string]: ScopeListener<T> } = {};
  private _contextEvents: ScopeEvent<T>[];
  private readonly _listenerIdGenerator = createUniqueIdGenerator('ScopeListener');

  constructor(store: Store, config: ScopeConfig<T>) {
    const {name, initState, middleware, isImmutabilityEnabled, isSubscribedMacroAutoCreateEnabled, isFrozen} = config;
    this._name = name;
    this._initState =  initState;
    this._state = initState;
    this._store = store;
    // This code needed to save middleware correct order in dispatch method.
    this._middleware = [...middleware].reverse();
    this._isImmutabilityEnabled = isImmutabilityEnabled;
    this._isSubscribedMacroAutoCreateEnabled = isSubscribedMacroAutoCreateEnabled;
    this._isFrozen = isFrozen;
  }

  get name() {
    return this._name;
  }

  get isLocked() {
    return this._isFrozen;
  }

  get isActionDispatchAvailable() {
    return this._isActionDispatchAvailable;
  }

  get isSubscribedMacroAutoCreateEnabled() {
    return this._isSubscribedMacroAutoCreateEnabled;
  }

  get state() {
    return this._state;
  }

  get context() {
    return this._context;
  }

  get store() {
    return this._store;
  }

  get supportActions() {
    return Object.getOwnPropertyNames(this._actions);
  }

  registerAction<PROPS, TRANSFORMED_OUT = T>(
    actionName: string,
    action: ScopeAction<T, PROPS>,
    transformer?: ScopeActionResultTransformer<T, PROPS, TRANSFORMED_OUT>
  ) {
    if (this._isFrozen) {
      throw new Error(`This scope is locked you can't add new action.`);
    }
    if (actionName in this._actions || (this._isSubscribedMacroAutoCreateEnabled && actionName in this)) {
      throw new Error(`Action name ${actionName} is duplicate or reserved in scope ${this._name}.`);
    }
    this._actions[actionName] = action;

    const actionDispatcher = (props?: PROPS, emitEvent?: boolean) => {
      const dispatchResult = this.dispatch(actionName, props, emitEvent);
      return transformer ? transformer(dispatchResult, props) : dispatchResult;
    };

    if (this._isSubscribedMacroAutoCreateEnabled) {
      const capitalizeFirstLetterActionName = () => {
        return actionName.charAt(0).toUpperCase() + actionName.slice(1);
      };

      const subscriberMacroName = `on${capitalizeFirstLetterActionName()}`;

      this.registerMacro(subscriberMacroName, (state, listener: ScopeListener<T>) => {
        return this.subscribe(listener, actionName);
      });
    }

    this[actionName] = actionDispatcher;

    storeDevTool.onChangeScope(this, {type: ScopeChangeEventType.REGISTER_ACTION, actionName});

    return actionDispatcher;
  }

  registerMacro<IN, OUT>(
    macroName: string,
    macro: ScopeMacro<T, IN, OUT>,
    macroType: ScopeMacroType = ScopeMacroType.FUNCTION
  ) {
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
        || macroType === ScopeMacroType.FUNCTION
        || (macroType === ScopeMacroType.GETTER && Object.getOwnPropertyDescriptor(this, macroName).get)
        || (macroType === ScopeMacroType.SETTER && Object.getOwnPropertyDescriptor(this, macroName).set))) {
      throw new Error(`Macro name ${macroName} is reserved in scope ${this._name}.`);
    }
    const macroFunc = (props?: IN) => {
      return macro(this._state, props);
    };
    switch (macroType) {
      case ScopeMacroType.FUNCTION:
        this[macroName] = macroFunc;
        break;
      case ScopeMacroType.GETTER:
        Object.defineProperty(this, macroName, {get: macroFunc, configurable: true, enumerable: true});
        break;
      case ScopeMacroType.SETTER:
        Object.defineProperty(this, macroName, {set: macroFunc, configurable: true, enumerable: true});
        break;
    }

    storeDevTool.onChangeScope(this, {type: ScopeChangeEventType.REGISTER_MACRO, macroName, macroType});
  }

  dispatch(actionName: string, props?, emitEvent = true) {
    let action: ScopeAction<T, any> = this._actions[actionName];

    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }

    if (!this._isActionDispatchAvailable) {
      throw new Error('Now action dispatch not available. Other action spreads.');
    }

    if (this._isImmutabilityEnabled && props && typeof props === 'object') {
      deepFreeze(props);
    }

    this._middleware.forEach(
      middleware => action = middleware.appendActionMiddleware(action)
    );

    const oldState = this._isActionInProgress ? this._context : this._state;

    const buildScopeError = (reason) => ({
      reason,
      oldState,
      scopeName: this._name,
      actionName,
      props
    }) as ScopeError<T>;

    const onFulfilled = newState => {
      if (this._isImmutabilityEnabled) {
        deepFreeze(newState);
      }
      const event: ScopeEvent<T> = {
        oldState,
        newState,
        scopeName: this._name,
        storeName: this._store.name,
        actionName,
        props
      };

      if (this._isActionInProgress) {
        if (emitEvent) {
          this._contextEvents
            ? this._contextEvents.push(event)
            : this._contextEvents = [event];
        }
        this._context = newState;
        return newState;
      }

      this._context = null;
      this._state = newState;

      if (this._contextEvents) {
        event.childrenEvents = this._contextEvents
          .map(contextEvent => ({...contextEvent, parentEvent: event}));
      }

      this._contextEvents = null;
      this._isActionDispatchAvailable = false;

      const dispatchEvent = (event: ScopeEvent<T>) => {
        storeDevTool.onAction(event);
        Object.getOwnPropertyNames(this._listeners).forEach(key => {
          const listener = this._listeners[key];
          try {
            if (listener) listener(event);
          } catch (reason) {
            storeDevTool.onActionListenerError(buildScopeError(reason));
          }
        });
      };

      if (emitEvent) {
        if (event.childrenEvents) {
          event.childrenEvents.forEach(dispatchEvent);
        }
        dispatchEvent(event);
      }

      this._isActionDispatchAvailable = true;

      return newState;
    };

    const onRejected = reason => {
      const error = buildScopeError(reason);
      if (!this._isActionInProgress) {
        storeDevTool.onActionError(error);
      }
      return error;
    };

    if (this._isActionInProgress) {
      try {
        return onFulfilled(action(oldState, props));
      } catch (e) {
        throw onRejected(e);
      }
    }

    try {
      this._isActionInProgress = true;
      this._context = oldState;
      const actionResult = action(oldState, props);
      this._isActionInProgress = false;
      return onFulfilled(actionResult);
    } catch (e) {
      this._isActionInProgress = false;
      throw onRejected(e);
    }
  }

  subscribe(listener: ScopeListener<T>, actionName?: string | string[]): ScopeListenerUnsubscribeCallback {
    const actionNames: string[] = [];

    if (Array.isArray(actionName)) {
      actionNames.push(...actionName);
    } else if (actionName) {
      actionNames.push(actionName);
    }

    actionNames.forEach(actionName => {
      if (!(actionName in this._actions)) {
        throw new Error(`Action (${actionName}) not present in scope.`);
      }
    });

    const listenerId = this._listenerIdGenerator();
    this._listeners[listenerId] = event => {

      if (actionNames.length === 0) {
        return listener(event);
      }

      const isActionPresentInScope = actionNames.findIndex(
        actionName => actionName === event.actionName
      ) !== -1;

      if (isActionPresentInScope) {
        listener(event);
      }
    };

    return Object.assign(() => this.unsubscribe(listenerId), {listenerId});
  }

  unsubscribe(id: string) {
    return delete this._listeners[id];
  }

  lock() {
    this._isFrozen = true;
    storeDevTool.onChangeScope(this, {type: ScopeChangeEventType.LOCK});
  }

  reset() {
    this._state = this._initState;
  }

}

class StoreImpl implements Store {

  private readonly _name: string;
  private readonly _scopes: Scope[];
  private readonly _scopeNameGenerator = createUniqueIdGenerator('Scope');
  private _isFrozen: boolean;

  constructor(config: StoreConfig) {
    const {name, isFrozen} = config;
    this._name = name;
    this._isFrozen = isFrozen;
    this._scopes = [];
  }

  get name() {
    return this._name;
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

  get scopes() {
    return this._scopes.map(it => it.name);
  }

  createScope<T>(config: ScopeConfig<T> = {}): Scope<T> {
    if (this._isFrozen) {
      throw new Error(`This Store is locked you can't add new scope.`);
    }
    const {
      name = this._scopeNameGenerator(),
      initState = null,
      middleware = [],
      isImmutabilityEnabled = false,
      isSubscribedMacroAutoCreateEnabled = false,
      isFrozen = false
    } = config;
    const isScopeExist = !!this._scopes.find(it => it.name === name);
    if (isScopeExist) {
      throw new Error(`Scope name must unique`);
    }
    let scope = new ScopeImpl<T>(this, {
      name,
      initState,
      middleware: middleware as ScopeMiddleware<T>[],
      isImmutabilityEnabled,
      isSubscribedMacroAutoCreateEnabled,
      isFrozen
    });
    this._scopes.push(scope);
    middleware.forEach(middleware => middleware.postSetup(scope));
    storeDevTool.onCreateScope(scope);
    storeDevTool.onChangeStore(this, {type: StoreChangeEventType.CREATE_SCOPE, scopeName: name});
    return scope;
  }

  getScope<T = {}>(scopeName: string): Scope<T> {
    const scope = this._scopes.find(it => it.name === scopeName);
    if (!scope) {
      throw new Error(`Scope with name ${scopeName} not present in store with name ${this._name}`);
    }
    return scope;
  }

  lock() {
    this._isFrozen = true;
    this._scopes.forEach(it => it.lock());
    storeDevTool.onChangeStore(this, {type: StoreChangeEventType.LOCK});
  }

  reset() {
    this._scopes.forEach(it => it.reset());
  }

}

/**
 * @function isStoreExist
 * @summary Check is store exist.
 * @param {string} storeName Name of store.
 * @return {boolean} Status of store exist.
 */
export function isStoreExist(storeName: string) {
  return !!stores.find(it => it.name === storeName);
}

/**
 * @function createStore
 * @summary Create a new store and return it.
 * @param {StoreConfig} config Name of store.
 * @return {Store} Store.
 * @throws {Error} Will throw an error if name of store not unique.
 */
export function createStore(config: StoreConfig): Store {
  const {
    name,
    isFrozen = false,
  } = config;
  if (isStoreExist(name)) {
    throw new Error('Store name must unique');
  }
  const store = new StoreImpl({name, isFrozen});
  stores.push(store);
  storeDevTool.onCreateStore(store);
  return store;
}

/**
 * @function getStore
 * @summary Returns store.
 * @param {string} storeName Name scope, to get the Scope.
 * @return {Store} Store
 * @throws {Error} Will throw an error if scope not present.
 */
export function getStore(storeName: string): Store {
  if (!isStoreExist(storeName)) {
    throw new Error(`Store with name ${storeName} not present`);
  }
  return stores.find(it => it.name === storeName);
}

/**
 * @function getState
 * @summary Returns all store states.
 * @return {{string: {string: any}}} Scope states
 */
export function getState() {
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
export function setStoreDevTool(devTool: Partial<StoreDevTool>) {
  Object.assign(storeDevTool, devTool);
}
