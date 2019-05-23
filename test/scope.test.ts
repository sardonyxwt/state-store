import {createStore, Scope} from '../src';

describe('Scope', () => {

  let store = createStore({name: 'TestStore'});
  let scope: Scope<number> = store.createScope();

  let listenerId;
  const ACTION_NAME = 'action';
  const TEST_VALUE = 1000;

  it('registerAction', () => {
    scope.registerAction(ACTION_NAME, (state, props: number) => {
      return props;
    });
  });

  it('registerTransformer', () => {
    scope.registerMacro('sum', (state, props) => {
      return props as any + state as any;
    });
    expect(scope['sum'](2000)).toEqual(2000);
  });

  it('lock', () => {
    scope.lock();
    try {
      scope.registerAction('freezeTest', (state) => state);
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
    }, ACTION_NAME).listenerId;
  });

  it('dispatch', () => {
    const newScope = scope.dispatch(ACTION_NAME, TEST_VALUE);
    expect(newScope).toEqual(TEST_VALUE);
  });

  it('unsubscribe', () => {
    scope.unsubscribe(listenerId);
  });

  it('state', () => {
    expect(scope.state).toEqual(TEST_VALUE);
  });

  it('getSupportActions', () => {
    expect(scope.supportActions)
      .toEqual([ACTION_NAME]);
  });

  it('reset', () => {
    scope.reset();
    expect(scope.state).toEqual(null);
  });


});
