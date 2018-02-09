import {deepFreeze} from '@sardonyxwt/utils/object';
import {uniqueId} from '@sardonyxwt/utils/generator';

export type Listener<T> = (event: { newScope: T, oldScope: T, actionName: string }) => void;
export type Action<T> = (scope: T, props, resolve: (newScope: T) => void, reject: (error) => void) => void;

export interface Scope<T = any> {

  /**
   * Registers a new action in scope.
   * @param {string} name The action name.
   * @param {Action} action The action that changes the scope
   * @throws {Error} Will throw an error if the scope frozen or action name exists in scope
   * when it is called.
   */
  registerAction(name: string, action: Action<T>);

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
   * Prevents the addition of new actions to scope.
   */
  freeze(): void;

  /**
   * Returns scope state.
   * @return Scope state.
   */
  getState(): T;

}

class ScopeImpl<T = any> implements Scope<T> {

  private isFrozen = false;
  private actions: { [key: string]: Action<T> } = {};
  private listeners: { [key: string]: Listener<T> } = {};

  constructor(readonly name: string, private state: T) {
  }

  registerAction(name: string, action: Action<T>) {
    if (this.isFrozen) {
      throw new Error(`This scope is frozen you can't add new action.`);
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
    const oldScope = this.state;
    return new Promise<T>((resolve, reject) => {
      action(oldScope, props, resolve, reject);
    }).then(newScope => {
      deepFreeze(newScope);
      Object.getOwnPropertyNames(this.listeners).forEach(
        key => this.listeners[key]({oldScope, newScope, actionName})
      );
      this.state = newScope;
      return newScope;
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

  unsubscribe(id: string) {
    return delete this.listeners[id];
  }

  freeze() {
    this.isFrozen = true;
  }

  getState() {
    return this.state;
  }

}

const scopes: { [key: string]: Scope<any> } = {};

/**
 * Create a new scope and return it.
 * @param {string} name The name of scope
 * By default generate unique name
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
 * Returns scope.
 * @param {string} scopeName Name scope, to get the Scope.
 * @return {Scope} Scope
 */
export function getScope(scopeName) {
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
