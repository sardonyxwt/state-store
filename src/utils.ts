let indexes: { [key: string]: number } = {};

export function generateId(name: string = 'default') {
  indexes[name]? ++indexes[name] : indexes[name] = 0;
  return `${name}_${indexes[name]}`;
}
