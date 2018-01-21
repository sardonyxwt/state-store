import {uniqueId, deepFreeze} from './utils';

type Listener = (event: { newScope, oldScope, actionName: string }) => void;
type Action = (scope, props, resolve: (newScope) => void, reject: (error) => void) => void;

export class Scope {

  private actions: Map<string, Action> = new Map();
  private listeners: Map<string, Listener> = new Map();

  constructor(readonly name: string, private state) {
  }

  /**
   * Registers a new action in scope.
   * @param {string} name The action name.
   * @param {Action} action The action that changes the scope
   * when it is called.
   */
  registerAction(name: string, action: Action) {
    if (this.actions.has(name)) {
      throw new Error(`Action name is duplicate in scope ${this.name}`);
    }
    this.actions.set(name, action);
  }

  /**
   * Dispatches an action. It is the only way to trigger a scope change.
   * @param {string} actionName Triggered action with same name.
   * This action change scope and return new scope.
   * You can use resolve to change the scope or reject to throw an exception.
   * @param {any?} props Additional data for the correct operation of the action.
   * @return {Promise<any>} You can use the promise to get a new state of scope
   * or catch errors
   */
  dispatch(actionName: string, props?) {
    const action: Action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`This action not exists ${actionName}`);
    }
    const oldScope = this.state;
    return new Promise((resolve, reject) => {
      action(oldScope, props, resolve, reject);
    }).then(newScope => {
      deepFreeze(newScope);
      this.listeners.forEach(
        it => it({oldScope, newScope, actionName})
      );
      this.state = newScope;
      return newScope;
    });
  }

  /**
   * Adds a scope change listener.
   * It will be called any time an action is dispatched.
   * @param {Listener} listener A callback to be invoked on every dispatch.
   * By default use ROOT_SCOPE id.
   * @return {string} A listener id to remove this change listener later.
   */
  subscribe(listener: Listener) {
    const listenerId = uniqueId('listener');
    this.listeners.set(listenerId, listener);
    return listenerId;
  }

  /**
   * Removes a scope change listener.
   * @param {string} id Id of the listener to delete.
   */
  unsubscribe(id: string) {
    this.listeners.delete(id);
  }

  /**
   * Returns scope state.
   * @return {any} Scope state
   */
  getState() {
    return this.state;
  }

}

const scopes: Map<string, Scope> = new Map();

/**
 * Create a new scope and return it.
 * @param {string} name The name of scope
 * By default generate unique name
 * @param {any} initState The initial scope state.
 * By default use empty object.
 * @return {Scope} Scope.
 */
export function createScope(name = uniqueId('scope'), initState = {}) {
  if (scopes.has(name)) {
    throw new Error(`Scope name must unique`);
  }
  const scope = new Scope(name, initState);
  scopes.set(name, scope);
  return scope;
}

/**
 * Returns scope.
 * @param {string} scopeName Name scope, to get the Scope.
 * @return {Scope} Scope
 */
export function getScope(scopeName) {
  return Array.from(scopes.values()).find(
    scope => scope.name === scopeName
  );
}

/**
 * Returns all scope states.
 * @return {{string: any}} Scope states
 */
export function getState() {
  const state = {};
  scopes.forEach(scope => state[scope.name] = scope.getState());
  return state;
}

/**
 * This scope is global
 * @type {Scope}
 */
export const ROOT_SCOPE = createScope('rootScope');
