import { uniqueId, deepFreeze, keys, values } from './utils';
import { Action, ActionType, Listener, ListenerType } from './types';

const scopes: { [id: string]: any } = {};
const actions: { [id: string]: Action } = {};
const listeners: { [id: string]: Listener } = {};

export const ROOT_SCOPE = registerScope('rootScope');

export function registerScope(name: string = 'scope', initScope: any = {}) {
  const scopeId = uniqueId(name);

  if (scopeId in scopes) {
    throw new Error(`This scope already exists ${scopeId}`);
  }

  scopes[scopeId] = deepFreeze(initScope);
  return scopeId;
}

export function registerAction(scopeId: string, action: ActionType) {
  const isScopeExists = scopeId in scopes;

  if (!isScopeExists) {
    throw new Error(`This scope not exists ${scopeId}`);
  }

  const actionId = uniqueId('store_action');
  actions[actionId] = { scopeId, func: action };
  return actionId;
}

export function dispatch(actionId: string, props: any) {
  const action = actions[actionId];

  if (!action) {
    throw new Error(`This action not exists ${actionId}`);
  }

  const scopeId = action.scopeId;
  const oldScope = scopes[scopeId];

  return new Promise((resolve, reject) => {
    action.func(oldScope, props, resolve);
  }).then(newScope => {
    deepFreeze(newScope)
    values(listeners)
      .filter(it => it.scopeId === scopeId)
      .forEach(it => it.func({ oldScope, newScope, actionId }));
    scopes[scopeId] = newScope;
    return newScope;
  });
}

export function subscribe(scopeId: string, listener: ListenerType) {
  const scope = scopes[scopeId];

  if (!scope) {
    throw new Error(`This action not exists ${scopeId}`);
  }

  const newListener = { scopeId, func: listener };
  const listenerId = uniqueId('listener');

  listeners[listenerId] = newListener;
  return listenerId;
}

export function unsubscribe(listenerId: string) {
  delete listeners[listenerId];
}

export function getScope(scopeId: string) {
  return scopes[scopeId];
}

export function getState() {
  return { ...scopes };
}
