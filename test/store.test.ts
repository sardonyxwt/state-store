/// <reference types="jest" />
import Store, {ROOT_SCOPE} from '../';

describe('Store', () => {

  let scopeId: string;
  let actionId: string;
  let listenerId: string;
  const testValue = 1000;

  it('registerScope', () => {
    scopeId = Store.registerScope('testScope');
  });

  it('registerAction', () => {
    actionId = Store.registerAction((scope, props, resolved) => {
      resolved(props);
    }, scopeId);
  });

  it('subscribe', () => {
    listenerId = Store.subscribe(({newScope}) => {
      expect(newScope).toEqual(testValue);
    }, scopeId);
  });

  it('dispatch', () => {
    Store.dispatch(actionId, testValue).then(newScope => {
      expect(newScope).toEqual(testValue);
    });
  });

  it('unsubscribe', () => {
    Store.unsubscribe(listenerId);
  });

  it('getScope', () => {
    const scope = Store.getScope(scopeId);
    expect(scope).toEqual(testValue);
  });

  it('getState', () => {
    const state = Store.getState();
    expect(state).toEqual({
      [ROOT_SCOPE]: {},
      [scopeId]: testValue
    });
  });

});
