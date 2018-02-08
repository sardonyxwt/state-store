## [state-store](https://github.com/sardonyxwt/state-store) 

state-store is a predictable state container for JavaScript and Typescript apps. 

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
import {createScope} from '@sardonyxwt/state-store';

const INCREMENT_ACTION = 'increment';
const DECREMENT_ACTION = 'decrement';
const SET_COUNTER_ACTION = 'setCounter';

// Create a new scope
const counterScope = createScope('counterScope', 0);

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

// You can use freeze() to forbid add new action to scope.
counterScope.freeze();

// You can use subscribe() to update the UI in response to state changes.
let allActionListenerId = counterScope.subscribe(
  ({oldScope, newScope, actionId}) => {
    console.log(oldScope, newScope, actionId)
  }
);

// You can use subscribe() with specific actionName to handle only this action.
let setCounterActionListenerId = counterScope.subscribe(
  () => console.log('set counter value action dispatch.'),
  SET_COUNTER_ACTION
);

// The only way to mutate the internal state in scope is to dispatch an action.
counterScope.dispatch(INCREMENT_ACTION);
counterScope.dispatch(DECREMENT_ACTION);

counterScope.dispatch(SET_COUNTER_ACTION, 1000)
  .then(newScope => console.log(newScope));

counterScope.dispatch(SET_COUNTER_ACTION, "invalid props")
  .catch(err => console.log(err));

counterScope.unsubscribe(allActionListenerId);
counterScope.unsubscribe(setCounterActionListenerId);

console.log(counterScope.getState());
```

### License

state-store is [MIT licensed](./LICENSE).
