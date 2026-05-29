export const COUNTRY_CODES = [
  {
    name: 'UAE',
    code: '+971',
    iso: 'ae',
    minLength: 9,
    maxLength: 9,
    currency: 'AED',
  },
  {
    name: 'India',
    code: '+91',
    iso: 'in',
    minLength: 10,
    maxLength: 10,
    currency: 'INR',
  },
  {
    name: 'Bangladesh',
    code: '+88',
    iso: 'bd',
    minLength: 11,
    maxLength: 11,
    currency: 'BDT',
  },
  {
    name: 'Nepal',
    code: '+977',
    iso: 'np',
    minLength: 10,
    maxLength: 10,
    currency: 'NPR',
  },
  {
    name: 'Pakistan',
    code: '+92',
    iso: 'pk',
    minLength: 10,
    maxLength: 11,
    currency: 'PKR',
  },
  {
    name: 'Saudi Arabia',
    code: '+966',
    iso: 'sa',
    minLength: 9,
    maxLength: 9,
    currency: 'SAR',
  },
  {
    name: 'Oman',
    code: '+968',
    iso: 'om',
    minLength: 8,
    maxLength: 8,
    currency: 'OMR',
  },
  {
    name: 'USA',
    code: '+1',
    iso: 'us',
    minLength: 10,
    maxLength: 10,
    currency: 'USD',
  },
]

const HOST_TO_DIAL_CODE = [
  { hosts: ['baji', '1ten365', 'sbexch247'], code: '+88' },
]

const FALLBACK_DIAL_CODE = '+88'

/** Default dial code for the current hostname, used to seed phone-number forms. */
export function getDefaultCountryCode() {
  if (typeof window === 'undefined') return FALLBACK_DIAL_CODE
  const host = window.location.hostname
  for (const rule of HOST_TO_DIAL_CODE) {
    if (rule.hosts.some((h) => host.includes(h))) return rule.code
  }
  return FALLBACK_DIAL_CODE
}
