import { Decimal } from '@prisma/client/runtime/library';

/**
 * Recursively converts Prisma Decimal objects to numbers and BigInt to strings
 * to ensure the object is serializable for Client Components.
 */
export function sanitizeResponse<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // BigInt check MUST come before the object check
  if (typeof data === 'bigint') {
    return data.toString() as unknown as T;
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeResponse(item)) as unknown as T;
    }

    // Check if it's a Decimal
    if (
      (data as any) instanceof Decimal || 
      (typeof (data as any).toNumber === 'function' && typeof (data as any).toFixed === 'function')
    ) {
      return (data as any).toNumber() as unknown as T;
    }

    // Check if it's a Date
    if (data instanceof Date) {
      return data.toISOString() as unknown as T;
    }

    const newData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = sanitizeResponse((data as any)[key]);
      }
    }
    return newData as T;
  }

  return data;
}
