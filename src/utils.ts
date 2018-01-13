let indexes: { [key: string]: number } = {};

export function uniqueId(name: string = 'default') {
  indexes[name] ? ++indexes[name] : indexes[name] = 0;
  let index = indexes[name];
  return `${name}${index ? index : ''}`;
}

export function keys(object: Object) {
  return Object.getOwnPropertyNames(object);
}

export function values<T>(obj: { [key: string]: T }): T[] {
  return keys(obj).map(key => obj[key]);
}

export function deepFreeze<T>(obj: T) {
  keys(obj).forEach(function (key) {
    let prop = obj[key];
    if (typeof prop == 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}
