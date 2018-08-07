## [state-store](https://github.com/sardonyxwt/state-store) 

state-store is a predictable async state container for JavaScript and Typescript apps. 

### Installation

To install the stable version:

```
npm install --save @sardonyxwt/state-store
```

This assumes you are using [npm](https://www.npmjs.com/) as your package manager. 

### The Gist

The whole state of your app is stored in an scopes inside a single *store*.  
The only way to change the scope is to emit an *action*, an object describing what happened.  
To specify how the actions transform the scope, you write pure *action* and register its in scope.

That's it!

```js
import {createScope, composeScope, setStoreDevTool} from '@sardonyxwt/state-store';

const INCREMENT_ACTION = 'increment';
const DECREMENT_ACTION = 'decrement';
const SET_COUNTER_ACTION = 'setCounter';

const logScopeMiddleware = {
  postSetup: (scope) => {
    console.log('Scope(' + scope.name + ') with LogScopeMiddleware complete setup.')
  },
  appendActionMiddleware: (action) => {
    return (state, props, resolve, reject) => {
      console.log('Log from LogScopeMiddleware: ', state, props);
      action(state, props, resolve, reject);
    }
  }
};

// Create a new scope
const counterScope = createScope('counterScope', 0, [logScopeMiddleware]);

// Registers a new action in COUNTER_SCOPE
counterScope.registerAction(
  INCREMENT_ACTION,
  (scope, props, resolved) => resolved(scope + 1)
);

counterScope.registerAction(
  DECREMENT_ACTION,
  (scope, props, resolved) => resolved(scope - 1),
);

counterScope.registerAction(
  SET_COUNTER_ACTION,
  (scope, props, resolved, rejected) => {
    if(typeof props !== 'number') {
      rejected(new Error('Props is not number'));
    }
    resolved(props);
  }
);

// You can use lock() to forbid add new action to scope.
counterScope.lock();

// You can use isLocked() to check is scope is lock.
counterScope.isLocked();

// You can use subscribe() to update the UI in response to state changes.
let allActionListenerId = counterScope.subscribe(
  ({oldScope, newScope, scopeName, actionName, props}) => {
    console.log(oldScope, newScope, scopeName, actionName, props)
  }
);

// You can use subscribe() with specific actionName (you can use array of actions) to handle only this action.
let setCounterActionListenerId = counterScope.subscribe(
  () => console.log('set counter value action dispatch.'),
  SET_COUNTER_ACTION
);

let syncObject1, syncObject2;

// You can use synchronize() to synchronize the object with scope state.
let synchronizeObject1Id = counterScope.synchronize(syncObject1, 'state');

// You can use synchronize() with specific actionName to handle only this action.
let synchronizeObject2Id = counterScope.synchronize(syncObject2, 'state', INCREMENT_ACTION);

// The only way to mutate the internal state in scope is to dispatch an action.
counterScope.dispatch(INCREMENT_ACTION);
counterScope.dispatch(DECREMENT_ACTION);

counterScope.dispatch(SET_COUNTER_ACTION, 1000)
  .then(newScope => console.log(newScope));

counterScope.dispatch(SET_COUNTER_ACTION, "invalid props")
  .catch(err => console.log(err));

counterScope.unsubscribe(allActionListenerId);
counterScope.unsubscribe(setCounterActionListenerId);
counterScope.unsubscribe(synchronizeObject1Id);
counterScope.unsubscribe(synchronizeObject2Id);

console.log(counterScope.getState());

// You can use getSupportActions to get supported actions of scope.
console.log(counterScope.getSupportActions());

// You can use composeScope to create compose scope.
const composedScope = composeScope('ComposeScope', [counterScope, ROOT_SCOPE]);

composedScope.dispatch(SET_COUNTER_ACTION, 2000);

console.log(composedScope.getState());

// You can use setStoreDevTool to set middleware dev tool
setStoreDevTool({
  //Call when created new scope.
  onCreate(scope) {
    console.log('Scope with name: ' + scope.name + ' created');
  },
  //Call when change scope (lock, registerAction, dispatch).
  onChange(scope) {
    console.log('Scope with name: ' + scope.name + ' changed', {
      supportActions: scope.getSupportActions(),
      isLock: scope.isLocked(),
      state: scope.getState()
    })
  },
  //Call when in any scope dispatch action.
  onAction(event) {
    console.log('StoreAction: ', event)
  },
  //Call when in any scope dispatch action error.
  onActionError(error) {
    console.log('StoreActionError: ', error)
  }
});
```

### License

state-store is [MIT licensed](./LICENSE).
