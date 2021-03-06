## [state-store](https://github.com/sardonyxwt/state-store) 

state-store is a predictable sync state container for JavaScript and Typescript apps. 

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
import {createStore, isStoreExist, getStore, setStoreDevTool, ScopeMacroType} from '@sardonyxwt/state-store';

// You can use setStoreDevTool to set middleware dev tool.
setStoreDevTool({
  // Call when created new store.
  onCreateStore(store) {
    console.log('Store with name: ' + store.name + ' created');
  },
  // Call when change store (createScope, lock).
  onChangeStore(store, details) {
    console.log('Store with name: ' + store.name + ' changed', {
      scopes: store.scopes,
      isLocked: store.isLocked,
      state: store.state
    }, 'details: ', details)
  },
  // Call when created new scope.
  onCreateScope(scope) {
    console.log('Scope with name: ' + scope.name + ' created');
  },
  // Call when change scope (registerAction, registerMacro, lock).
  onChangeScope(scope, details) {
    console.log('Scope with name: ' + scope.name + ' changed', {
      supportActions: scope.supportActions,
      isLocked: scope.isLocked,
      state: scope.state
    }, 'details: ', details)
  },
  // Call when in any scope dispatch action.
  onAction(event) {
    console.log('StoreAction: ', event)
  },
  // Call when in any scope dispatch action error.
  onActionError(error) {
    console.log('StoreActionError: ', error)
  }
});

const INCREMENT_ACTION = 'increment';
const DECREMENT_ACTION = 'decrement';
const SET_COUNTER_ACTION = 'setCounter';

// Scope middleware example.
const logScopeMiddleware = {
  postSetup: (scope) => {
    console.log('Scope(' + scope.name + ') with LogScopeMiddleware complete setup.')
  },
  appendActionMiddleware: (action) => {
    return (state, props) => {
      console.log('Log from LogScopeMiddleware: ', state, props);
      return action(state, props);
    }
  }
};

// Create a new store.
const counterStore = createStore({name: 'CounterStore'});

// You can use isStoreExist to check is store exist
console.log('Store is present: ', isStoreExist('CounterStore'));

// You can use getStore to get store
console.log('Store: ', getStore('CounterStore'));

// Create a new scope.
const counterScope = counterStore.createScope({
  name: 'CounterScope', 
  initState: 0, 
  middleware: [logScopeMiddleware]
});

// Registers a new action in COUNTER_SCOPE.
counterScope.registerAction(
  INCREMENT_ACTION,
  (scope, props) => scope + 1
);

counterScope.registerAction(
  DECREMENT_ACTION,
  (scope, props) => scope - 1,
);

// You can save action dispatcher and call later.
const setCounterActionDispatcher = counterScope.registerAction(
  SET_COUNTER_ACTION,
  (scope, props) => {
    if(typeof props !== 'number') {
      throw new Error('Props is not number');
    }
    return props;
  }
  /*
  * You can use actionResultTransformer to change result value it only affect in action dispatcher.
  * , (actionResult, props) => actionResult + props + 10000
  * */
);

// You can add macro as it and call later.
counterScope.registerMacro('remains', (state, props) => {
  const remains = props - state;
  if (remains < 0) {
    return 0;
  }
  return remains;
});

// You can add macro as getter or setter type.
counterScope.registerMacro('count', (state) => {
  return state;
}, ScopeMacroType.GETTER);

// You can use lock() to forbid add new action to scope.
counterScope.lock();

// You can use lock() to forbid create new scopes to store and lock all included scopes.
counterStore.lock();

// You can use isLocked to check is scope is lock.
console.log(counterScope.isLocked);

// You can use isLocked to check is store is lock.
console.log(counterStore.isLocked);

// You can use subscribe() to update the UI in response to state changes.
let allActionListenerUnsubscribeCallback = counterScope.subscribe(
  ({oldScope, newScope, scopeName, actionName, props}) => {
    console.log(oldScope, newScope, scopeName, actionName, props)
  }
);

// You can use subscribe() with specific action names to handle only this actions.
let setCounterActionUnsubscribeCallback = counterScope.subscribe(
  () => console.log('set counter value action dispatch.'),
  [SET_COUNTER_ACTION]
);

// The only way to mutate the internal state in scope is to dispatch an action.
counterScope.dispatch(INCREMENT_ACTION);
counterScope.dispatch(DECREMENT_ACTION);

console.log(counterScope.dispatch(SET_COUNTER_ACTION, 1000));

try {
  counterScope.dispatch(SET_COUNTER_ACTION, "invalid props")
} catch (err) {
  console.log(err)
}

// dispatch action with action dispatcher.
setCounterActionDispatcher(1000);

// or you can call action dispatcher like this.
// The method name is the same as the action name.
counterScope.setCounter(2000);

// call remains macro.
console.log(counterScope.remains(10000));

// call getter count macro.
console.log(counterScope.count);

counterScope.unsubscribe(allActionListenerUnsubscribeCallback.listenerId);
setCounterActionUnsubscribeCallback();

console.log(counterScope.state);
console.log(counterStore.state);

// You can use getSupportActions to get supported actions of scope.
console.log(counterScope.supportActions);

// You can use counterStore.scopes to get all scopes of store.
console.log(counterStore.scopes);

// You can use reset to set scopes state to init state.
counterStore.reset();

// You can use reset to set state to init state.
counterScope.reset();
```

### License

state-store is [MIT licensed](./LICENSE).
