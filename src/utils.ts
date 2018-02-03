let indexes: { [key: string]: number } = {};

function makeSeed(length: number) {
  const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let seed = "";
  for (let i = 0; i < length; i++)
    seed += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  return seed;
}

export function uniqueId(name: string = 'default') {
  indexes[name] ? ++indexes[name] : indexes[name] = 0;
  let index = indexes[name];
  return `${name}-${index}-${makeSeed(8)}`;
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
