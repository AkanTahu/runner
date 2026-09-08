/**
 * Recursively removes any property whose value is `undefined`.
 * Firebase Firestore throws an error ("Unsupported field value: undefined")
 * whenever an object has a field with an undefined value.
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item)) as unknown as Partial<T>;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        result[key] = removeUndefinedFields(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as Partial<T>;
}
