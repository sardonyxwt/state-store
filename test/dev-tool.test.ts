/// <reference types="jest" />
import {Scope, ScopeError, ScopeEvent, setStoreDevTool} from "../src";

describe('Scope', () => {

  it('setStoreDevTool', () => {
    setStoreDevTool({
      onAction(event: ScopeEvent) {

      },
      onActionError(error: ScopeError) {

      },
      onChange(scope: Scope) {

      },
      onCreate(scope: Scope) {

      }
    });
  });

});
