import { generateId } from './utils';

export type ListenerType = (event: { newScope: any, oldScope: any }) => void;
export type ActionType = (
  scope: any,
  props: any,
  resolved: (newScope: any) => void
) => void;
export type Action = { scopeId: string, func: ActionType };
export type Listener = { actionId: string, func: ListenerType };

export class Store {

  private static scopes: { [id: string]: any } = {};
  private static actions: { [id: string]: Action } = {};
  private static listeners: { [id: string]: Listener } = {};

  static scope(scopeId: string, initScope: any = {}): string {
    if (scopeId in this.scopes) {
      throw new Error(`This scope already exists ${scopeId}`);
    }
    this.scopes[scopeId] = initScope;
    return scopeId;
  }

  static action(scopeId: string, action: ActionType): string {
    if (scopeId in Store.scopes) {
      const actionId = generateId('store_action');
      Store.actions[actionId] = { scopeId, func: action };
      return actionId;
    } else throw new Error(`This scope not exists ${scopeId}`);
  }

  static dispatch(actionId: string, props: any) {
    if (actionId in this.actions) {
      const action = this.actions[actionId];
      const scopeId = action.scopeId;
      const oldScope = this.scopes[scopeId];
      const resolvedCallback = (newScope: any) => {
        this.scopes[scopeId] = newScope;
        for (let listenerIndex in this.listeners) {
          let listener = this.listeners[listenerIndex];
          if (listener.actionId === actionId) {
            listener.func({ newScope, oldScope });
          }
        }
      };
      action.func(oldScope, props, resolvedCallback);
    } else throw new Error(`This action not exists ${actionId}`);
  }

  static subscribe(actionId: string, listener: ListenerType): string {
    if (actionId in this.actions) {
      const newListener = { actionId, func: listener };
      const listenerId = generateId('store_listener');
      this.listeners[listenerId] = newListener;
      return listenerId;
    } else throw new Error(`This action not exists ${actionId}`);
  }

  static unsubscribe(listenerId: string) {
    delete this.listeners[listenerId];
  }

  static getState(): any {
    return this.scopes;
  }

}

export const ROOT_SCOPE = Store.scope('rootScope');

export default Store;
