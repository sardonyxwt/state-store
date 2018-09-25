/// <reference types="jest" />
import {createSyncScope, getState, SyncScope, ROOT_SCOPE} from '../src';

describe('Scope', () => {

  let scope: SyncScope<number>;

  let listenerId;
  let objectSynchronizeId;
  let synchronizeObject = {};
  const ACTION_NAME = 'action';
  const TEST_VALUE = 1000;

  it('createScope', () => {
    scope = createSyncScope();
  });

  it('registerAction', () => {
    scope.registerAction(ACTION_NAME, (scope, props: number) => {
      return props;
    });
  });

  it('lock', () => {
    scope.lock();
    try {
      scope.registerAction('freezeTest', (scope) => scope);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('isLocked', () => {
    expect(scope.isLocked).toEqual(true);
  });

  it('subscribe', () => {
    listenerId = scope.subscribe(({newState}) => {
      expect(newState).toEqual(TEST_VALUE);
    }, ACTION_NAME);
  });

  it('synchronize', () => {
    objectSynchronizeId = scope.synchronize(synchronizeObject, 'state');
  });

  it('dispatch', () => {
    const newScope = scope.dispatch(ACTION_NAME, TEST_VALUE);
    expect(newScope).toEqual(TEST_VALUE);
  });

  it('unsubscribe', () => {
    scope.unsubscribe(listenerId);
    scope.unsubscribe(objectSynchronizeId);
  });

  it('synchronize object check', () => {
    const state = scope.state;
    expect({state}).toEqual(synchronizeObject);
  });

  it('getScope', () => {
    expect(scope.state).toEqual(TEST_VALUE);
  });

  it('getState', () => {
    const state = getState();
    expect(state).toEqual({
      [ROOT_SCOPE.name]: {},
      [scope.name]: TEST_VALUE
    });
  });

  it('getSupportActions', () => {
    expect(scope.supportActions)
      .toEqual([ACTION_NAME]);
  });

});
