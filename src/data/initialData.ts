import { CafeInfo } from '../types';

// Neutral placeholder shown only until the first /cafe fetch lands. The real
// cafe identity (id, name, tagline, address, ...) comes from the `cafes` row
// in the database — never hardcode a brand name here.
export const INITIAL_CAFE: CafeInfo = {
  id: '',
  name: 'Cafe',
  tagline: '',
  logo: '',
  address: '',
  phone: '',
  currency: '₹',
  taxPercent: 0,
  serviceChargePercent: 0,
  isAcceptingOrders: true,
  upiId: '',
};
