import { deepFreeze } from '@sardonyxwt/utils/object';
import { uniqueId } from '@sardonyxwt/utils/generator';
import { syncPromises } from '@sardonyxwt/utils/synchronized';

export type Listener<T> = (event: { newState: T, oldState: T, actionName: string, props }) => void;
export type Action<T> = (state: T, props, resolve: (newState: T) => void, reject: (error) => void) => void;

export interface Scope<T = any> {

  /**
   * @var Scope name.
   * Name unique for scope.
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
  dispatch(actionName: string, props?): Promise<T>;

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

  /**
   * Returns support actions.
   * @return Support actions.
   */
  getSupportActions(): string[];

}

class ScopeImpl<T = any> implements Scope<T> {

  private isFrozen = false;
  private actions: { [key: string]: Action<T> } = {};
  private listeners: { [key: string]: Listener<T> } = {};

  constructor(readonly name: string, private state: T) {
  }

  registerAction(name: string, action: Action<T>) {
    if (this.isFrozen) {
      throw new Error(`This scope is locked you can't add new action.`);
    }
    if (name in this.actions) {
      throw new Error(`Action name is duplicate in scope ${this.name}`);
    }
    this.actions[name] = action;
  }

  dispatch(actionName: string, props?) {
    const action: Action<T> = this.actions[actionName];
    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }
    if(props && typeof props === 'object') {
      deepFreeze(props);
    }
    const oldState = this.state;
    return new Promise<T>((resolve, reject) => {
      action(oldState, props, resolve, reject);
    }).then(newState => {
      deepFreeze(newState);
      Object.getOwnPropertyNames(this.listeners).forEach(
        key => this.listeners[key]({oldState, newState, actionName, props})
      );
      this.state = newState;
      return newState;
    });
  }

  subscribe(listener: Listener<T>, actionName?: string) {
    if (actionName && !(actionName in this.actions)) {
      throw new Error(`Action (${actionName}) not present in scope.`);
    }
    const listenerId = uniqueId('listener');
    this.listeners[listenerId] = event => {
      if (!actionName || actionName === event.actionName) {
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
      scope.lock();
      actionNames = [...actionNames, ...scope.getSupportActions()];
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
        syncPromises(dispatchPromises).then(
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
export function composeScope(name, scopes: (Scope | string)[]): Scope {
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
 * This scope is global
 * @type {Scope}
 */
export const ROOT_SCOPE = createScope('rootScope', {});
