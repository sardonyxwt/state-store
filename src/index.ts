import {uniqueId, deepFreeze} from './utils';

type ListenerEventType = { newScope, oldScope, actionId: string };
type Listener = (event: ListenerEventType) => void;
type Action = (scope, props, resolve: (newScope) => void, reject: (error) => void) => void;
type Scope = { scope, actions: Map<string, Action>, listeners: Map<string, Listener> };

const scopes: Map<string, Scope> = new Map();

/**
 * This scope id use by default.
 * @type {string}
 */
export const ROOT_SCOPE = registerScope('rootScope');

/**
 * Registers a new scope and return id.
 * @param {string} name A prefix of create scope id.
 * @param {any} initScopeState The initial scope state.
 * By default use empty object.
 * @return {string} Id from registered scope.
 */
function registerScope(name = 'scope', initScopeState = {}) {
  const scopeId = uniqueId(name);

  scopes.set(scopeId, {
    actions: new Map(), listeners: new Map(), scope: deepFreeze(initScopeState)
  });
  return scopeId;
}

/**
 * Registers a new action in scope and return action id.
 * @param {Action} action The action that changes the scope
 * when it is called.
 * @param {string} scopeId Id of the scope to register the action.
 * By default use ROOT_SCOPE id.
 * @return {string} Id from registered action.
 */
function registerAction(action: Action, scopeId = ROOT_SCOPE) {
  const scope = scopes.get(scopeId);

  if (!scope) {
    throw new Error(`Scope not exists ${scopeId}`);
  }

  const actionId = uniqueId('store_action');
  scope.actions.set(actionId, action);
  return actionId;
}

/**
 * Dispatches an action. It is the only way to trigger a scope change.
 * @param {string} actionId Triggered action id.
 * This action change scope and return new scope.
 * You can use resolve to change the scope or reject to throw an exception.
 * @param {any?} props Additional data for the correct operation of the action.
 * @return {Promise<any>} You can use the promise to get a new state of scope
 * or catch errors
 */
function dispatch(actionId: string, props?) {
  const scope = Array.from(scopes.values()).find(
    scope => scope.actions.has(actionId)
  );

  if (!scope) {
    throw new Error(`This action not exists ${actionId}`);
  }

  const action: Action = scope.actions.get(actionId);
  const oldScope = scope.scope;

  return new Promise((resolve, reject) => {
    action(oldScope, props, resolve, reject);
  }).then(newScope => {
    deepFreeze(newScope);
    scope.listeners.forEach(
      it => it({oldScope, newScope, actionId})
    );
    scope.scope = newScope;
    return newScope;
  });
}

/**
 * Adds a scope change listener.
 * It will be called any time an action is dispatched.
 * @param {Listener} listener A callback to be invoked on every dispatch.
 * @param {string} scopeId Id of the scope to subscribe the listener.
 * By default use ROOT_SCOPE id.
 * @return {string} A listener id to remove this change listener later.
 */
function subscribe(listener: Listener, scopeId = ROOT_SCOPE) {
  const scope = scopes.get(scopeId);

  if (!scope) {
    throw new Error(`This scope not exists ${scopeId}`);
  }

  const listenerId = uniqueId('listener');
  scope.listeners.set(listenerId, listener);
  return listenerId;
}

/**
 * Removes a scope change listener.
 * @param {string} id Id of the listener to delete.
 */
function unsubscribe(id: string) {
  scopes.forEach(scope => scope.listeners.delete(id));
}

/**
 * Returns scope state.
 * @param {string} scopeId Id scope, to get the state.
 * By default use ROOT_SCOPE id.
 * @return {any} Scope state
 */
function getScope(scopeId = ROOT_SCOPE) {
  const scope = scopes.get(scopeId);

  if (!scope) {
    throw new Error(`Scope not exists ${scopeId}`);
  }

  return scope.scope;
}

/**
 * Returns all scope states.
 * @return {{string: any}} Scope states
 */
function getState() {
  const state = {};
  Array.from(scopes.entries()).forEach(
    ([key, scope]) => state[key] = scope.scope
  );
  return state;
}

export default {
  registerScope,
  registerAction,
  dispatch,
  subscribe,
  unsubscribe,
  getScope,
  getState
};
