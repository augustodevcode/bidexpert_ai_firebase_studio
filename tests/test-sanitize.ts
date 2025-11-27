import { Decimal } from '@prisma/client/runtime/library';
import { sanitizeResponse } from './src/lib/serialization-helper';

const decimal = new Decimal('10.50');
const obj = {
  id: 1,
  price: decimal,
  nested: {
    value: new Decimal('20.00')
  },
  list: [new Decimal('30.00')]
};

const sanitized = sanitizeResponse(obj);
console.log('Original:', JSON.stringify(obj, null, 2)); // JSON.stringify might handle Decimal if it has toJSON
console.log('Sanitized:', JSON.stringify(sanitized, null, 2));

if (typeof (sanitized as any).price === 'number') {
  console.log('Price is number');
} else {
  console.log('Price is NOT number:', typeof (sanitized as any).price);
}
