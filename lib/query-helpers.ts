
import { Prisma } from '@prisma/client';

// Helper to convert Decimal to number for a single object
const convertDecimalsToNumbers = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Prisma.Decimal) {
    return obj.toNumber() as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item)) as any;
  }

  const newObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value instanceof Prisma.Decimal) {
        newObj[key] = value.toNumber() as any;
      } else if (typeof value === 'object') {
        newObj[key] = convertDecimalsToNumbers(value);
      } else {
        newObj[key] = value;
      }
    }
  }
  return newObj;
};

export const sanitizeObject = <T>(obj: T): T => {
  return convertDecimalsToNumbers(obj);
};

export const sanitizeArray = <T>(arr: T[]): T[] => {
  return arr.map(item => convertDecimalsToNumbers(item));
};
