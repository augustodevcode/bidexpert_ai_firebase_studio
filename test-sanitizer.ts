
import { sanitizeResponse } from './src/lib/serialization-helper';
import { Decimal } from '@prisma/client/runtime/library';

const d = new Decimal(10.5);
const obj = {
  price: d,
  name: 'Test'
};

console.log('Original:', obj);
const sanitized = sanitizeResponse(obj);
console.log('Sanitized:', sanitized);

if (typeof sanitized.price === 'number') {
  console.log('SUCCESS: price is a number');
} else {
  console.error('FAILURE: price is NOT a number', sanitized.price);
}
