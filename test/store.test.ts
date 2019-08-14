import {createStore, isStoreExist, getStore, Scope, Store} from '../src';

describe('Store', () => {

  let store: Store;
  let scope: Scope;

  it('createStore', () => {
    store = createStore({name: 'TestStore'});
  });

  it('isStoreExist', () => {
    expect(isStoreExist('TestStore')).toBeTruthy();
    expect(isStoreExist('NotPresentStoreName')).toBeFalsy();
  });

  it('getStore', () => {
    getStore('TestStore');
  });

  it('createScope', () => {
    scope = store.createScope();
  });

  it('state', () => {
    expect(store.state).toEqual({[scope.name]: null});
  });

  it('lock', () => {
    store.lock();
    try {
      store.createScope();
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('isLocked', () => {
    expect(store.isLocked).toEqual(true);
  });

  it('getScope', () => {
    const scopeName = scope.name;
    expect(store.getScope(scopeName).name).toEqual(scopeName);
  });

});
