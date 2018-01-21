let indexes: { [key: string]: number } = {};

export function uniqueId(name: string = 'default') {
  indexes[name] ? ++indexes[name] : indexes[name] = 0;
  let index = indexes[name];
  return `${name}${index ? index : ''}`;
}

export function deepFreeze<T>(obj: T) {
  Object.getOwnPropertyNames(obj).forEach(function (key) {
    let prop = obj[key];
    if (typeof prop == 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}
