import {Scope, Store, ScopeError, ScopeEvent, setStoreDevTool} from "../src";

describe('Scope', () => {

  it('setStoreDevTool', () => {
    setStoreDevTool({
      onAction(event: ScopeEvent) {

      },
      onActionError(error: ScopeError) {

      },
      onChangeScope(scope: Scope) {

      },
      onCreateScope(scope: Scope) {

      },
      onCreateStore(store: Store) {

      },
      onChangeStore(store: Store) {

      }
    });
  });

});
