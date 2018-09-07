import {deepFreeze} from '@sardonyxwt/utils/object';
import {uniqueId} from '@sardonyxwt/utils/generator';

export type ScopeEvent<T = any> = { newState: T, oldState: T, scopeName: string, actionName: string, props };
export type ScopeError<T = any> = { reason, oldState: T, scopeName: string, actionName: string, props };
export type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export type ScopeAction<T> = (state: T, props, resolve: (newState: T) => void, reject: (error) => void) => void;

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
   * @function registerAction
   * @summary Registers a new action in scope.
   * @param {string} name The action name.
   * @param {ScopeAction} action The action that changes the state of scope
   * @throws {Error} Will throw an error if the scope locked or action name exists in scope
   * when it is called.
   */
  registerAction(name: string, action: ScopeAction<T>): void;

  /**
   * @function dispatch
   * @summary Dispatches an action.
   * @description Dispatches an action is the only way to trigger a scope change.
   * @param {string} actionName Triggered action with same name.
   * @description This action change state of scope and return new state.
   * You can use resolve to change the state or reject to throw an exception.
   * @param {any?} props Additional data for the correct operation of the action.
   * @return {Promise} You can use the promise to get a new state of scope
   * or catch errors.
   * @throws {Error} Will throw an error if the actionName not present in scope.
   */
  dispatch(actionName: string, props?): Promise<T>;

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
   * @param {string} actionName Specific action to synchronize.
   * @return {string} A listener id to remove this change listener later.
   * @throws {Error} Will throw an error if actionName not present in scope.
   */
  synchronize(object: object, key: string, actionName?: string): string;

  /**
   * @function lock
   * @summary Prevents the addition of new actions to scope.
   */
  lock(): void;

  /**
   * @function isLocked
   * @summary Check is locked status.
   * @return {boolean} Scope locked status.
   */
  isLocked(): boolean;

  /**
   * @function getState
   * @summary Returns scope state.
   * @return Scope state.
   */
  getState(): T;

  /**
   * @function getSupportActions
   * @summary Returns support actions.
   * @return {string[]} Support actions.
   */
  getSupportActions(): string[];

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

let storeDevTool: StoreDevTool = null;

class ScopeImpl<T = any> implements Scope<T> {

  private isFrozen = false;
  private actionQueue: (() => void)[] = [];
  private actions: { [key: string]: ScopeAction<T> } = {};
  private middleware: ScopeMiddleware<T>[] = [];
  protected listeners: { [key: string]: ScopeListener<T> } = {};

  constructor(
    readonly name: string,
    private state: T,
    middleware: ScopeMiddleware<T>[]) {
    // This code needed to save middleware correct order in dispatch method.
    this.middleware = [...middleware];
    this.middleware.reverse();
  }

  registerAction(name: string, action: ScopeAction<T>) {
    if (this.isFrozen) {
      throw new Error(`This scope is locked you can't add new action.`);
    }
    if (name in this.actions) {
      throw new Error(`Action name is duplicate in scope ${this.name}`);
    }
    this.actions[name] = action;
    if (storeDevTool) {
      storeDevTool.onChange(this);
    }
  }

  dispatch(actionName: string, props?) {
    let action: ScopeAction<T> = this.actions[actionName];

    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }

    if (props && typeof props === 'object') {
      deepFreeze(props);
    }

    let oldState;

    const startNextDeferredAction = () => {
      this.actionQueue.shift();
      if (this.actionQueue.length > 0) {
        const deferredAction = this.actionQueue[0];
        deferredAction();
      }
    };

    return new Promise<T>((resolve, reject) => {
      const isFirstAction = this.actionQueue.length === 0;
      const deferredAction = () => {
        oldState = this.getState();
        this.middleware.forEach(
          middleware => action = middleware.appendActionMiddleware(action)
        );
        action(oldState, props, resolve, reject);
      };
      this.actionQueue.push(deferredAction);
      if (isFirstAction) {
        deferredAction();
      }
    }).then(newState => {
      deepFreeze(newState);
      const event: ScopeEvent<T> = {
        oldState,
        newState,
        scopeName: this.name,
        actionName,
        props
      };
      Object.getOwnPropertyNames(this.listeners).forEach(key => {
        const listener = this.listeners[key];
        if (listener) listener(event);
      });
      this.state = newState;
      if (storeDevTool) {
        storeDevTool.onAction(event);
        storeDevTool.onChange(this);
      }
      startNextDeferredAction();
      return newState;
    }, reason => {
      const error: ScopeError<T> = {
        reason,
        oldState,
        scopeName: this.name,
        actionName,
        props
      };
      if (storeDevTool) {
        storeDevTool.onActionError(error);
      }
      startNextDeferredAction();
      throw error;
    });
  }

  subscribe(listener: ScopeListener<T>, actionName?: string | string[]) {
    const actionNames = [];

    if (Array.isArray(actionName)) {
      actionNames.push(...actionName);
    } else if (typeof actionName === 'string') {
      actionNames.push(actionName);
    }

    actionNames.forEach(actionName => {
      if (!(actionName in this.actions)) {
        throw new Error(`Action (${actionName}) not present in scope.`);
      }
    });

    const listenerId = uniqueId('listener');
    this.listeners[listenerId] = event => {

      const isActionPresentInScope = actionNames.findIndex(
        actionName => actionName === event.actionName
      ) !== -1;

      if (actionNames.length === 0 || isActionPresentInScope) {
        listener(event);
      }
    };
    return listenerId;
  }

  synchronize(object: object, key: string, actionName?: string) {
    object[key] = this.getState();
    return this.subscribe(({newState}) => {
      object[key] = newState;
    }, actionName);
  }

  unsubscribe(id: string) {
    return delete this.listeners[id];
  }

  lock() {
    this.isFrozen = true;
    if (storeDevTool) {
      storeDevTool.onChange(this);
    }
  }

  isLocked() {
    return this.isFrozen;
  }

  getState() {
    return this.state;
  }

  getSupportActions() {
    return Object.getOwnPropertyNames(this.actions);
  }

}

class ComposeScopeImpl extends ScopeImpl<{}> {

  constructor(
    readonly name: string,
    private scopes: Scope[],
    middleware: ScopeMiddleware[]
  ) {
    super(name, {}, middleware);

    if (this.isLocked()) {
      throw new Error('You can not use middleware that lock scope to create a composite scope.');
    }

    let actionNames: string[] = [];

    scopes.forEach(scope => {
      actionNames = [...actionNames, ...scope.getSupportActions()];

      scope.lock();
      scope.subscribe(({actionName, props, oldState}) => {
        const currentState = this.getState();
        Object.getOwnPropertyNames(this.listeners)
          .forEach(key => this.listeners[key]({
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
      actionName, (state, props, resolve, reject) => {
        let dispatchPromises = scopes.filter(
          scope => scope.getSupportActions().findIndex(
            it => it === actionName
          ) >= 0
        ).map(scope => scope.dispatch(actionName, props));
        Promise.all(dispatchPromises).then(
          () => resolve(this.getState())
        ).catch(reject);
      }
    ));

    this.lock();
  }

  getState(): {} {
    let state = {};

    this.scopes.forEach(
      scope => state[scope.name] = scope.getState()
    );

    return state;
  }

}

const scopes: { [key: string]: Scope<any> } = {};

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
export function createScope<T>(
  name = uniqueId('scope'),
  initState: T = null,
  middleware: ScopeMiddleware<T>[] = []
): Scope<T> {
  if (name in scopes) {
    throw new Error(`Scope name must unique`);
  }
  const scope = new ScopeImpl<T>(name, initState, middleware);
  scopes[name] = scope;
  middleware.forEach(middleware => middleware.postSetup(scope));
  if (storeDevTool) {
    storeDevTool.onCreate(scope);
  }
  return scope;
}

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
export function composeScope(
  name: string,
  scopes: (Scope | string)[],
  middleware: ScopeMiddleware[] = []
): Scope {
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
  const scope = new ComposeScopeImpl(name, composeScopes, middleware);
  scopes[name] = scope;
  middleware.forEach(middleware => middleware.postSetup(scope));
  if (storeDevTool) {
    storeDevTool.onCreate(scope);
  }
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
    state[key] = scopes[key].getState();
  });
  return state;
}

/**
 * @function setStoreDevTool
 * @summary Set store dev tool.
 * @param {StoreDevTool} devTool Dev tool middleware, to handle store changes.
 */
export function setStoreDevTool(devTool: StoreDevTool) {
  storeDevTool = devTool;
}

/**
 * @var ROOT_SCOPE
 * @summary This scope is global
 * @type {Scope}
 */
export const ROOT_SCOPE = createScope('rootScope', {});
