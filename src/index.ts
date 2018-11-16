import {deepFreeze} from '@sardonyxwt/utils/object';
import {uniqueId} from '@sardonyxwt/utils/generator';

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
export type ScopeConfig<T, OUT> = { name?, initState?: T, middleware?: ScopeMiddleware<T, OUT>[], isSubscribeMacroAutoCreateEnable?: boolean, isFrozen?: boolean };
export type ScopeEvent<T = any> = { newState: T, oldState: T, scopeName: string, actionName: string, props };
export type ScopeError<T = any> = { reason, oldState: T, scopeName: string, actionName: string, props };
export type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export type ScopeAction<T, IN, OUT> = (state: T, props: IN) => OUT;
export type ScopeMacro<T, IN, OUT> = (state: T, props?: IN) => OUT;
export type ScopeActionResultTransformer<IN, OUT, TRANSFORMED_OUT> = (actionResult: OUT, props: IN) => TRANSFORMED_OUT;
export type ScopeActionDispatcher<T, IN, OUT> = (props: IN) => OUT;

export enum ScopeMacroType {
  GETTER = 'GETTER',
  SETTER = 'SETTER',
  FUNCTION = 'FUNCTION',
}

/**
 * @interface Scope
 * @summary The whole state of your app is stored in an scopes inside a single store.
 */
export interface Scope<T = any, OUT = any> {

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
  registerAction<IN, TRANSFORMED_OUT = OUT>(
    actionName: string,
    action: ScopeAction<T, IN, OUT>,
    transformer?: ScopeActionResultTransformer<IN, OUT, TRANSFORMED_OUT>
  ): ScopeActionDispatcher<T, IN, TRANSFORMED_OUT>;

  /**
   * @function registerMacro
   * @summary Registers a new macro in scope.
   * @param {string} macroName The transformer name.
   * @param {ScopeMacro} macro The transformer used to add getter macros to scope.
   * @param {ScopeMacroType} macroType Register macro type.
   * @throws {Error} Will throw an error if the scope locked or macro name exists in scope
   * when it is called.
   */
  registerMacro<IN, OUT>(
    macroName: string,
    macro: ScopeMacro<T, IN, OUT>,
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
   * @return {Promise} Return promise.
   * You can use it to get a new state of scope or catch errors.
   * @throws {Error} Will throw an error if the actionName not present in scope.
   */
  dispatch(actionName: string, props?): OUT;

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
 * @interface SyncScope
 * @summary The whole state of your app is stored in an scopes inside a single store.
 * @description Use this scope type with promises actions.
 */
export interface SyncScope<T = any> extends Scope<T, T> {}

/**
 * @interface AsyncScope
 * @summary The whole state of your app is stored in an scopes inside a single store.
 * @description Use this scope type with synced actions.
 */
export interface AsyncScope<T = any> extends Scope<T, Promise<T>> {}

/**
 * @interface ScopeMiddleware
 * @summary You can use middleware to use aspect programing.
 */
export interface ScopeMiddleware<T, OUT> {

  /**
   * @function postSetup
   * @param {Scope} scope Created scope.
   * @summary You can use this method to setup custom actions in scope or
   * subscribe to actions in scope. Lock scope in this point is bad practice.
   */
  postSetup(scope: Scope<T, OUT>): void;

  /**
   * @function appendActionMiddleware
   * @summary This method wraps the action with a new action and returns it.
   * @param {ScopeAction} action Wrapped action.
   * @return {ScopeAction} Action that wrapped old action
   */
  appendActionMiddleware<IN>(action: ScopeAction<T, IN, OUT>): ScopeAction<T, IN, OUT>;

}

export enum ScopeChangeEventType {
  REGISTER_MACRO = 'REGISTER_MACRO',
  REGISTER_ACTION = 'REGISTER_ACTION',
  LOCK = 'LOCK'
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

}

let storeDevTool: StoreDevTool = {
  onCreate: () => null,
  onChange: () => null,
  onAction: () => null,
  onActionError: () => null,
};

abstract class ScopeImpl<T, OUT> implements Scope<T, OUT> {

  protected readonly _name: string;
  protected _state: T;
  protected _isFrozen: boolean;
  protected _isSubscribeMacroAutoCreateEnable: boolean;
  protected _middleware: ScopeMiddleware<T, OUT>[];
  protected _actions: { [key: string]: ScopeAction<T, any, OUT> } = {};
  protected _listeners: { [key: string]: ScopeListener<T> } = {};

  protected constructor(config: ScopeConfig<T, OUT>) {
    const {name, initState, middleware, isSubscribeMacroAutoCreateEnable, isFrozen} = config;
    this._name = name;
    this._state = initState;
    // This code needed to save middleware correct order in dispatch method.
    this._middleware = [...middleware].reverse();
    this._isSubscribeMacroAutoCreateEnable = isSubscribeMacroAutoCreateEnable;
    this._isFrozen = isFrozen;
  }

  get name() {
    return this._name;
  }

  get isLocked() {
    return this._isFrozen;
  }

  get isSubscribeMacroAutoCreateEnable() {
    return this._isSubscribeMacroAutoCreateEnable;
  }

  get state() {
    return this._state;
  }

  get supportActions() {
    return Object.getOwnPropertyNames(this._actions);
  }

  registerAction<IN, TRANSFORMED_OUT = OUT>(
    actionName: string,
    action: ScopeAction<T, IN, OUT>,
    transformer: ScopeActionResultTransformer<IN, OUT, TRANSFORMED_OUT>
      = actionResult => <TRANSFORMED_OUT>(actionResult as any)
  ) {
    if (!transformer) {
      throw new Error(`Transformer cannot be null or undefined.`);
    }
    if (this._isFrozen) {
      throw new Error(`This scope is locked you can't add new action.`);
    }
    if (actionName in this._actions || actionName in this) {
      throw new Error(`Action name ${actionName} is duplicate or reserved in scope ${this._name}.`);
    }
    this._actions[actionName] = action;

    const actionDispatcher = (props: IN) => {
      return transformer(this.dispatch(actionName, props), props);
    };

    if (this._isSubscribeMacroAutoCreateEnable) {
      const capitalizeFirstLetterActionName = () => {
        return actionName.charAt(0).toUpperCase() + actionName.slice(1);
      };

      const subscriberMacroName = `on${capitalizeFirstLetterActionName()}`;

      this.registerMacro(subscriberMacroName, (state, listener: ScopeListener<T>) => {
        return this.subscribe(listener, actionName);
      });
    }

    this[actionName] = actionDispatcher;

    storeDevTool.onChange(this, {type: ScopeChangeEventType.REGISTER_ACTION, actionName});

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
    if (macroName in this
      && (macroType === ScopeMacroType.FUNCTION
        || macroType === ScopeMacroType.GETTER && Object.getOwnPropertyDescriptor(this, macroName).get
        || macroType === ScopeMacroType.SETTER && Object.getOwnPropertyDescriptor(this, macroName).set)) {
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

    storeDevTool.onChange(this, {type: ScopeChangeEventType.REGISTER_MACRO, macroName, macroType});
  }

  abstract dispatch(actionName: string, props?): OUT;

  subscribe(listener: ScopeListener<T>, actionName?: string | string[]) {
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

    const listenerId = uniqueId('listener');
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
    return listenerId;
  }

  synchronize(object: object, key?: string, actionName?: string) {
    const state = this.state;

    let listener: (newState: T) => void = null;

    if (key) {
      listener = (newState) => {
        object[key] = newState;
      };
    }

    if (!key && typeof state === "object") {
      listener = (newState) => {
        Object.getOwnPropertyNames(newState).forEach(
          key => object[key] = newState[key]
        );
      };
    }

    if (!listener) {
      throw new Error('If specific key not set, state must be object.');
    }

    listener(this.state);

    return this.subscribe(({newState}) => listener(newState), actionName);
  }

  unsubscribe(id: string) {
    return delete this._listeners[id];
  }

  lock() {
    this._isFrozen = true;
    storeDevTool.onChange(this, {type: ScopeChangeEventType.LOCK});
  }

}

class SyncScopeImpl<T = any> extends ScopeImpl<T, T> {

  constructor(config: ScopeConfig<T, T>) {
    super(config);
  }

  dispatch(actionName: string, props?) {
    let action: ScopeAction<T, any, T> = this._actions[actionName];

    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }

    if (props && typeof props === 'object') {
      deepFreeze(props);
    }

    this._middleware.forEach(
      middleware => action = middleware.appendActionMiddleware(action)
    );

    const onFulfilled = newState => {
      deepFreeze(newState);
      const event: ScopeEvent<T> = {
        oldState,
        newState,
        scopeName: this._name,
        actionName,
        props
      };
      this._state = newState;
      storeDevTool.onAction(event);
      Object.getOwnPropertyNames(this._listeners).forEach(key => {
        const listener = this._listeners[key];
        if (listener) listener(event);
      });
      return newState;
    };

    const onRejected = reason => {
      const error: ScopeError<T> = {
        reason,
        oldState,
        scopeName: this._name,
        actionName,
        props
      };
      storeDevTool.onActionError(error);
      return error;
    };

    const oldState = this._state;
    try {
      return onFulfilled(action(oldState, props));
    } catch (e) {
      throw onRejected(e);
    }
  }

}

class AsyncScopeImpl<T = any> extends ScopeImpl<T, Promise<T>> {

  private _actionQueue: (() => void)[] = [];

  constructor(config: ScopeConfig<T, Promise<T>>) {
    super(config);
  }

  dispatch(actionName: string, props?) {
    let action: ScopeAction<T, any, Promise<T>> = this._actions[actionName];

    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }

    if (props && typeof props === 'object') {
      deepFreeze(props);
    }

    let oldState;

    const startNextDeferredAction = () => {
      this._actionQueue.shift();
      if (this._actionQueue.length > 0) {
        const deferredAction = this._actionQueue[0];
        deferredAction();
      }
    };

    return new Promise<T>((resolve, reject) => {
      const isFirstAction = this._actionQueue.length === 0;
      const deferredAction = () => {
        oldState = this.state;
        this._middleware.forEach(
          middleware => action = middleware.appendActionMiddleware(action)
        );
        try {
          resolve(action(oldState, props));
        } catch (e) {
          reject(e);
        }
      };
      this._actionQueue.push(deferredAction);
      if (isFirstAction) {
        deferredAction();
      }
    }).then(newState => {
      deepFreeze(newState);
      const event: ScopeEvent<T> = {
        oldState,
        newState,
        scopeName: this._name,
        actionName,
        props
      };
      this._state = newState;
      storeDevTool.onAction(event);
      Object.getOwnPropertyNames(this._listeners).forEach(key => {
        const listener = this._listeners[key];
        if (listener) listener(event);
      });
      startNextDeferredAction();
      return newState;
    }, reason => {
      const error: ScopeError<T> = {
        reason,
        oldState,
        scopeName: this._name,
        actionName,
        props
      };
      storeDevTool.onActionError(error);
      startNextDeferredAction();
      throw error;
    });
  }

}

class ComposeScopeImpl extends AsyncScopeImpl<{}> {

  private readonly _scopes: Scope[];

  constructor(
    scopes: Scope[],
    config: ScopeConfig<any, Promise<{}>>
  ) {
    super(config);

    this._scopes = scopes;

    let actionNames: string[] = [];

    scopes.forEach(scope => {
      actionNames = [...actionNames, ...scope.supportActions];

      scope.lock();
      scope.subscribe(({actionName, props, oldState}) => {
        const currentState = this.state;
        Object.getOwnPropertyNames(this._listeners)
          .forEach(key => this._listeners[key]({
            oldState: {...currentState, [scope.name]: oldState},
            newState: currentState,
            scopeName: scope.name,
            actionName,
            props
          }));
      });
    });

    actionNames = actionNames.filter(
      (actionName, i, self) => self.indexOf(actionName) === i
    );

    actionNames.forEach(actionName => this.registerAction(
      actionName, (state, props) => {
        let dispatchPromises = scopes.filter(
          scope => scope.supportActions.findIndex(
            it => it === actionName
          ) >= 0
        ).map(scope => scope.dispatch(actionName, props));
        return Promise.all(dispatchPromises).then(() => this.state);
      }
    ));

    this.lock();
  }

  get state(): {} {
    let state = {};

    this._scopes.forEach(scope => state[scope.name] = scope.state);

    return state;
  }

}

const scopes: { [key: string]: Scope<any> } = {};

function createScope<T>(
  type: 'sync' | 'async',
  config: ScopeConfig<T, T | Promise<T>> = {}
): Scope<T> {
  const {
    name = uniqueId('scope'),
    initState = null,
    middleware = [],
    isSubscribeMacroAutoCreateEnable = false,
    isFrozen = false
  } = config;
  if (name in scopes) {
    throw new Error(`Scope name must unique`);
  }
  let scope: Scope<T>;
  if (type === "async") {
    scope = new AsyncScopeImpl<T>({name, initState, middleware: middleware as ScopeMiddleware<T, Promise<T>>[], isSubscribeMacroAutoCreateEnable, isFrozen});
  } else {
    scope = new SyncScopeImpl<T>({name, initState, middleware: middleware as ScopeMiddleware<T, T>[], isSubscribeMacroAutoCreateEnable, isFrozen});
  }
  scopes[name] = scope;
  middleware.forEach(middleware => middleware.postSetup(scope));
  storeDevTool.onCreate(scope);
  return scope;
}

/**
 * @function createAsyncScope
 * @summary Create a new scope and return it.
 * @param {ScopeConfig} config The name of scope.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export function createAsyncScope<T>(config: ScopeConfig<T, Promise<T>> = {}): AsyncScope<T> {
  return createScope('async', config) as AsyncScope<T>;
}

/**
 * @function createSyncScope
 * @summary Create a new scope and return it.
 * @param {ScopeConfig} config The name of scope.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export function createSyncScope<T>(config: ScopeConfig<T, T> = {}): SyncScope<T> {
  return createScope('sync', config) as SyncScope<T>;
}

/**
 * @function composeScope
 * @summary Compose a new scope and return it.
 * @description Compose a new scope and return it. All scopes is auto lock.
 * @return {Scope} Compose scope.
 * @throws {Error} Will throw an error if scopes length less fewer than two.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export function composeScope(
  scopes: (Scope | string)[],
  config: ScopeConfig<any, Promise<{}>> = {},
): AsyncScope<{}> {
  const {name = uniqueId('scope'), middleware = [], isSubscribeMacroAutoCreateEnable = false} = config;
  if (name in scopes) {
    throw new Error(`Scope name must unique`);
  }
  let composeScopes = scopes.map(
    scope => typeof scope === "string" ? getScope(scope) : scope
  ).filter(
    (scope, i, self) => scope && self.indexOf(scope) === i
  );
  const MIN_COMPOSE_SCOPE_COUNT = 2;
  if (composeScopes.length < MIN_COMPOSE_SCOPE_COUNT) {
    throw new Error(`Compose scopes length must be greater than one`);
  }
  const scope = new ComposeScopeImpl(composeScopes, {name, middleware, isSubscribeMacroAutoCreateEnable, initState: null, isFrozen: false});
  scopes[name] = scope;
  middleware.forEach(middleware => middleware.postSetup(scope));
  storeDevTool.onCreate(scope);
  return scope;
}

/**
 * @function getScope
 * @summary Returns scope.
 * @param {string} scopeName Name scope, to get the Scope.
 * @return {Scope} Scope
 * @throws {Error} Will throw an error if scope not present.
 */
export function getScope(scopeName: string) {
  if (!scopes[scopeName]) {
    throw new Error(`Scope with name ${scopeName} not present`);
  }
  return scopes[scopeName];
}

/**
 * @function getState
 * @summary Returns all scope states.
 * @return {{string: any}} Scope states
 */
export function getState() {
  const state = {};
  Object.getOwnPropertyNames(scopes).forEach(key => {
    state[key] = scopes[key].state;
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

/**
 * @var ROOT_SCOPE
 * @summary This scope is global
 * @type {Scope}
 */
export const ROOT_SCOPE = createAsyncScope({name: 'rootScope', initState: {}});
