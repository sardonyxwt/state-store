import {
    createStore,
    RESET_SCOPE_ACTION,
    RESTORE_SCOPE_ACTION,
    Scope,
    ScopeMacroType,
} from '@source';

describe('Scope', () => {
    const store = createStore({ name: 'TestStore' });
    const scope: Scope<number> = store.createScope();

    let listenerId;
    const ACTION_NAME = 'action';
    const MACRO_NAME = 'plus';
    const TEST_VALUE = 1000;

    it('registerAction', () => {
        scope.registerAction(ACTION_NAME, (state, props: number) => {
            return props;
        });
    });

    it('registerMacro', () => {
        scope.registerMacro(
            MACRO_NAME,
            (state, props: number) => {
                return state + props;
            },
            ScopeMacroType.FUNCTION,
        );
    });

    it('registerTransformer', () => {
        scope.registerMacro('sum', (state, props: number) => {
            return props + state;
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
        listenerId = scope.subscribe(
            ({ newState }) => {
                expect(newState).toEqual(TEST_VALUE);
            },
            [ACTION_NAME],
        ).listenerId;
    });

    it('dispatch', () => {
        const newScope = scope.dispatch(ACTION_NAME, TEST_VALUE);
        expect(newScope).toEqual(TEST_VALUE);
    });

    it('testMacro', () => {
        expect(
            (scope as typeof scope & { plus: (value: number) => number }).plus(
                1000,
            ),
        ).toEqual(2000);
    });

    it('unsubscribe', () => {
        scope.unsubscribe(listenerId);
    });

    it('state', () => {
        expect(scope.state).toEqual(TEST_VALUE);
    });

    it('getSupportActions', () => {
        expect(scope.supportActions).toEqual([
            RESET_SCOPE_ACTION,
            RESTORE_SCOPE_ACTION,
            ACTION_NAME,
        ]);
    });

    it('reset', () => {
        expect(scope.reset()).toEqual(null);
    });

    it('restore', () => {
        expect(scope.restore(1000)).toEqual(1000);
    });
});
