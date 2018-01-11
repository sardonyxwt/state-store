/// <reference types="jest" />
import { Store, ROOT_SCOPE } from '../src';

describe('Store', () => {

    let actionId: string;
    const testValue = 1000;

    it('init', () => {
        actionId = Store.action(ROOT_SCOPE, (scope, props, resolved) => {
            resolved(props);
        });
    });

    it('subscribe', () => {
        Store.subscribe(actionId, ({ newScope }) => {
            expect(newScope).toEqual(testValue);
        });
    });

    it('dispatch', () => {
        Store.dispatch(actionId, testValue);
    });

});
