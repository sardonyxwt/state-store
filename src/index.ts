import {uniqueId, deepFreeze, values} from './utils';

type ListenerEventType = { newScope, oldScope, actionId: string };
type ListenerType = (event: ListenerEventType) => void;
type ActionType = (scope, props, resolved: (newScope) => void, rejected: (error) => void) => void;
type Action = { scopeId: string, func: ActionType };
type Listener = { scopeId: string, func: ListenerType };

const scopes: { [id: string]: any } = {};
const actions: { [id: string]: Action } = {};
const listeners: { [id: string]: Listener } = {};

export const ROOT_SCOPE = registerScope('rootScope');

function registerScope(name = 'scope', initScope = {}) {
  const scopeId = uniqueId(name);

  if (scopeId in scopes) {
    throw new Error(`This scope already exists ${scopeId}`);
  }

  scopes[scopeId] = deepFreeze(initScope);
  return scopeId;
}

function registerAction(action: ActionType, scopeId = ROOT_SCOPE) {
  const isScopeExists = scopeId in scopes;

  if (!isScopeExists) {
    throw new Error(`This scope not exists ${scopeId}`);
  }

  const actionId = uniqueId('store_action');
  actions[actionId] = {scopeId, func: action};
  return actionId;
}

function dispatch(actionId: string, props) {
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

function unsubscribe(listenerId: string) {
  delete listeners[listenerId];
}

function getScope(scopeId = ROOT_SCOPE) {
  return scopes[scopeId];
}

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
