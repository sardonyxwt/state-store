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
import Store, {ROOT_SCOPE} from '@sardonyxwt/state-store';

const COUNTER_SCOPE = Store.registerScope('counterScope', 0);

const INCREMENT_ACTION = Store.registerAction(
  (scope, props, resolved) => resolved(scope + 1), 
  COUNTER_SCOPE
);

const DECREMENT_ACTION = Store.registerAction(
  (scope, props, resolved) => resolved(scope - 1), 
  COUNTER_SCOPE
);

const SET_COUNTER_ACTION = Store.registerAction(
  (scope, props, resolved, rejected) => {
    if(typeof props !== 'number') {
      rejected(new Error('Props is not number'));
    }
    resolved(props);
  },
  COUNTER_SCOPE
);

let listenerId = Store.subscribe(
  ({oldScope, newScope, actionId}) => { 
    console.log(oldScope, newScope, actionId)
  }, 
  COUNTER_SCOPE
);

Store.dispatch(INCREMENT_ACTION);
Store.dispatch(DECREMENT_ACTION);

Store.dispatch(SET_COUNTER_ACTION, 1000)
  .then(newScope => console.log(newScope));

Store.dispatch(SET_COUNTER_ACTION, "invalid props")
  .catch(err => console.log(err));

Store.unsubscribe(listenerId);

console.log(Store.getScope(COUNTER_SCOPE));
console.log(Store.getScope(ROOT_SCOPE));
console.log(Store.getState());
```

### License

state-store is [MIT licensed](./LICENSE).
