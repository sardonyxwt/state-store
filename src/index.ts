import { deepFreeze } from '@sardonyxwt/utils/object';
import { uniqueId } from '@sardonyxwt/utils/generator';

export type ScopeEvent<T = any> = { newState: T, oldState: T, scopeName: string, actionName: string, props };
export type ScopeError<T = any> = { reason, oldState: T, scopeName: string, actionName: string, props };
export type ScopeListener<T> = (event: ScopeEvent<T>) => void;
export type ScopeAction<T> = (state: T, props, resolve: (newState: T) => void, reject: (error) => void) => void;

export interface StoreDevTool {

  /**
   * Call when created new scope.
   * @param {Scope} scope Created scope.
   */
  onCreate(scope: Scope);

  /**
   * Call when change scope (lock, registerAction).
   * @param {Scope} scope Changed scope.
   */
  onChange(scope: Scope);

  /**
   * Call when in any scope dispatch action.
   * @param {ScopeEvent} event Action event.
   */
  onAction(event: ScopeEvent);

  /**
   * Call when in any scope dispatch action error.
   * @param {ScopeError} error Action error.
   */
  onActionError(error: ScopeError);

}

let storeDevTool: StoreDevTool = null;

export interface Scope<T = any> {

  /**
   * @var Scope name.
   * Name unique for scope.
   */
  readonly name: string;

  /**
   * Registers a new action in scope.
   * @param {string} name The action name.
   * @param {ScopeAction} action The action that changes the state of scope
   * @throws {Error} Will throw an error if the scope locked or action name exists in scope
   * when it is called.
   */
  registerAction(name: string, action: ScopeAction<T>): void;

  /**
   * Dispatches an action. It is the only way to trigger a scope change.
   * @param {string} actionName Triggered action with same name.
   * This action change state of scope and return new state.
   * You can use resolve to change the state or reject to throw an exception.
   * @param {any?} props Additional data for the correct operation of the action.
   * @return {Promise} You can use the promise to get a new state of scope
   * or catch errors.
   * @throws {Error} Will throw an error if the actionName not present in scope.
   */
  dispatch(actionName: string, props?): Promise<T | ScopeError<T>>;

  /**
   * Adds a scope change listener.
   * It will be called any time an action is dispatched.
   * @param {ScopeListener} listener A callback to be invoked on every dispatch.
   * @param {string | string[]} actionName Specific action to subscribe.
   * @return {string} A listener id to remove this change listener later.
   * @throws {Error} Will throw an error if actionName not present in scope.
   */
  subscribe(listener: ScopeListener<T>, actionName?: string | string[]): string;

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

  /**
   * Returns support actions.
   * @return Support actions.
   */
  getSupportActions(): string[];

}

class ScopeImpl<T = any> implements Scope<T> {

  private isFrozen = false;
  private actionQueue: (() => void)[] = [];
  private actions: { [key: string]: ScopeAction<T> } = {};
  protected listeners: { [key: string]: ScopeListener<T> } = {};

  constructor(readonly name: string, private state: T) {
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
    const action: ScopeAction<T> = this.actions[actionName];

    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }

    if(props && typeof props === 'object') {
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
      const isFirstAction  = this.actionQueue.length === 0;
      const deferredAction = () => {
        oldState = this.getState();
        action(oldState, props, resolve, reject);
      };
      this.actionQueue.push(deferredAction);
      if (isFirstAction) {
        deferredAction();
      }
    }).then<T, ScopeError<T>>(newState => {
      deepFreeze(newState);
      const event: ScopeEvent<T> = {
        oldState,
        newState,
        scopeName: this.name,
        actionName,
        props
      };
      Object.getOwnPropertyNames(this.listeners).forEach(
        key => this.listeners[key](event)
      );
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
      return error;
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

  constructor(readonly name: string, private scopes: Scope[]) {
    super(name, {});

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
 * Create a new scope and return it.
 * @param {string} name The name of scope.
 * @default Generate unique name.
 * @param {any} initState The initial scope state.
 * By default use empty object.
 * @return {Scope} Scope.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export function createScope<T>(name = uniqueId('scope'), initState: T = null): Scope<T> {
  if (name in scopes) {
    throw new Error(`Scope name must unique`);
  }
  const scope = new ScopeImpl<T>(name, initState);
  scopes[name] = scope;
  if (storeDevTool) {
    storeDevTool.onCreate(scope);
  }
  return scope;
}

/**
 * Compose a new scope and return it.
 * @description All scopes is auto lock.
 * @param {string} name The name of scope
 * @param {(Scope | string)[]} scopes Scopes to compose.
 * Length must be greater than one
 * @return {Scope} Compose scope.
 * @throws {Error} Will throw an error if scopes length less fewer than two.
 * @throws {Error} Will throw an error if name of scope not unique.
 */
export function composeScope(name: string, scopes: (Scope | string)[]): Scope {
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
  const scope = new ComposeScopeImpl(name, composeScopes);
  scopes[name] = scope;
  if (storeDevTool) {
    storeDevTool.onCreate(scope);
  }
  return scope;
}

/**
 * Returns scope.
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
 * Returns all scope states.
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
 * Set store dev tool.
 * @param {StoreDevTool} devTool Dev tool middleware, to handle store changes.
 */
export function setStoreDevTool(devTool: StoreDevTool) {
  storeDevTool = devTool;
}

/**
 * This scope is global
 * @type {Scope}
 */
export const ROOT_SCOPE = createScope('rootScope', {});
