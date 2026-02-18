/**
 * @fileoverview Barrel exports para o módulo de endereço reutilizável.
 * 
 * Uso:
 * ```tsx
 * import { AddressComponent } from '@/components/address';
 * import { relationalAddressFields, addressDefaults } from '@/lib/schemas/address.schema';
 * ```
 */
export { default as AddressComponent } from './AddressComponent';
export type { AddressComponentProps, AddressFieldKey } from './AddressComponent';
export { default as AddressMapPicker } from './AddressMapPicker';
