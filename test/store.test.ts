/// <reference types="jest" />
import {createScope, getState, Scope, ROOT_SCOPE} from '../src';

describe('Store', () => {

  let scope: Scope;
  let listenerId;
  const ACTION_NAME = 'action';
  const TEST_VALUE = 1000;

  it('createScope', () => {
    scope = createScope();
  });

  it('registerAction', () => {
    scope.registerAction(ACTION_NAME, (scope, props, resolved) => {
      resolved(props);
    });
  });

  it('subscribe', () => {
    listenerId = scope.subscribe(({newScope}) => {
      expect(newScope).toEqual(TEST_VALUE);
    });
  });

  it('dispatch', () => {
    scope.dispatch(ACTION_NAME, TEST_VALUE).then(newScope => {
      expect(newScope).toEqual(TEST_VALUE);
    });
  });

  it('unsubscribe', () => {
    scope.unsubscribe(listenerId);
  });

  it('getScope', () => {
    expect(scope.getState()).toEqual(TEST_VALUE);
  });

  it('getState', () => {
    const state = getState();
    expect(state).toEqual({
      [ROOT_SCOPE.name]: {},
      [scope.name]: TEST_VALUE
    });
  });

});
