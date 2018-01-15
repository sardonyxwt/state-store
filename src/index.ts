import {uniqueId, deepFreeze, values} from './utils';

type ListenerEventType = { newScope, oldScope, actionId: string };
type ListenerType = (event: ListenerEventType) => void;
type ActionType = (scope, props, resolve: (newScope) => void, reject: (error) => void) => void;
type Action = { scopeId: string, func: ActionType };
type Listener = { scopeId: string, func: ListenerType };

const scopes: { [scopeId: string]: any } = {};
const actions: { [actionId: string]: Action } = {};
const listeners: { [listenerId: string]: Listener } = {};

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
  scopes[scopeId] = deepFreeze(initScopeState);
  return scopeId;
}

/**
 * Registers a new action in scope and return action id.
 * @param {ActionType} action The action that changes the scope
 * when it is called.
 * @param {string} scopeId Id of the scope to register the action.
 * By default use ROOT_SCOPE id.
 * @return {string} Id from registered action.
 */
function registerAction(action: ActionType, scopeId = ROOT_SCOPE) {
  const scope = scopes[scopeId];

  if (!scope) {
    throw new Error(`Scope not exists ${scopeId}`);
  }

  const actionId = uniqueId('store_action');
  actions[actionId] = {scopeId, func: action};
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
  const action = actions[actionId];

  if (!action) {
    throw new Error(`This action not exists ${actionId}`);
  }

  const scopeId = action.scopeId;
  const oldScope = scopes[scopeId];

  return new Promise((resolve, reject) => {
    action.func(oldScope, props, resolve, reject);
  }).then(newScope => {
    deepFreeze(newScope);
    values(listeners)
      .filter(it => it.scopeId === scopeId)
      .forEach(it => it.func({oldScope, newScope, actionId}));
    scopes[scopeId] = newScope;
    return newScope;
  });
}

/**
 * Adds a scope change listener.
 * It will be called any time an action is dispatched.
 * @param {ListenerType} listener A callback to be invoked on every dispatch.
 * @param {string} scopeId Id of the scope to subscribe the listener.
 * By default use ROOT_SCOPE id.
 * @return {string} A listener id to remove this change listener later.
 */
function subscribe(listener: ListenerType, scopeId = ROOT_SCOPE) {
  const scope = scopes[scopeId];

  if (!scope) {
    throw new Error(`This action not exists ${scopeId}`);
  }

  const newListener = {scopeId, func: listener};
  const listenerId = uniqueId('listener');

  listeners[listenerId] = newListener;
  return listenerId;
}

/**
 * Removes a scope change listener.
 * @param {string} listenerId Id of the listener to delete.
 */
function unsubscribe(listenerId: string) {
  delete listeners[listenerId];
}

/**
 * Returns scope state.
 * @param {string} scopeId Id scope, to get the state.
 * By default use ROOT_SCOPE id.
 * @return {any} Scope state
 */
function getScope(scopeId = ROOT_SCOPE) {
  return scopes[scopeId];
}

/**
 * Returns all scope states.
 * @return {{string: any}} Scope states
 */
function getState() {
  return {...scopes};
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
