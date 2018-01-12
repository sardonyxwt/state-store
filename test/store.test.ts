/// <reference types="jest" />
import * as Store from '../src';

describe('Store', () => {

    let scopeId: string;
    let actionId: string;
    let listenerId: string;
    const testValue = 1000;

    it('registerScope', () => {
        scopeId = Store.registerScope('testScope');
    });

    it('registerAction', () => {
        actionId = Store.registerAction(scopeId, (scope, props, resolved) => {
            resolved(props);
        });
    });

    it('subscribe', () => {
        listenerId = Store.subscribe(scopeId, ({ newScope }) => {
            expect(newScope).toEqual(testValue);
        });
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
            [Store.ROOT_SCOPE]: {},
            [scopeId]: testValue
        });
    });

});
