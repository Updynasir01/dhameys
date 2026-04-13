// shared/constants/index.ts

export const CABIN_CLASSES = [
  { value: 'economy',         label: 'Economy',         shortLabel: 'Eco' },
  { value: 'premium_economy', label: 'Premium Economy', shortLabel: 'Prem' },
  { value: 'business',        label: 'Business',        shortLabel: 'Biz' },
  { value: 'first',           label: 'First Class',     shortLabel: '1st' },
] as const;

export const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira' },
] as const;

export const PASSENGER_TYPES = [
  { value: 'adult',  label: 'Adult',  ageRange: '12+ years',  minAge: 12 },
  { value: 'child',  label: 'Child',  ageRange: '2–11 years', minAge: 2, maxAge: 11 },
  { value: 'infant', label: 'Infant', ageRange: 'Under 2',    maxAge: 2 },
] as const;

export const MEAL_PREFERENCES = [
  { value: 'AVML', label: 'Asian Vegetarian Meal' },
  { value: 'BBML', label: 'Baby Meal' },
  { value: 'BLML', label: 'Bland Meal' },
  { value: 'CHML', label: "Children's Meal" },
  { value: 'DBML', label: 'Diabetic Meal' },
  { value: 'FPML', label: 'Fruit Platter Meal' },
  { value: 'GFML', label: 'Gluten-Free Meal' },
  { value: 'HNML', label: 'Hindu Meal' },
  { value: 'KSML', label: 'Kosher Meal' },
  { value: 'LCML', label: 'Low Calorie Meal' },
  { value: 'MOML', label: 'Muslim Meal' },
  { value: 'NLML', label: 'Low Lactose Meal' },
  { value: 'SFML', label: 'Seafood Meal' },
  { value: 'VGML', label: 'Vegan Meal' },
  { value: 'VJML', label: 'Vegetarian Jain Meal' },
  { value: 'VLML', label: 'Vegetarian Lacto-Ovo Meal' },
] as const;

export const FLIGHT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled:  { label: 'On Time',    color: 'green' },
  delayed:    { label: 'Delayed',    color: 'amber' },
  boarding:   { label: 'Boarding',   color: 'blue' },
  departed:   { label: 'Departed',   color: 'blue' },
  in_air:     { label: 'In Flight',  color: 'blue' },
  landed:     { label: 'Landed',     color: 'green' },
  arrived:    { label: 'Arrived',    color: 'green' },
  cancelled:  { label: 'Cancelled',  color: 'red' },
  diverted:   { label: 'Diverted',   color: 'red' },
};

export const BOOKING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:              { label: 'Pending Payment', color: 'amber' },
  confirmed:            { label: 'Confirmed',       color: 'green' },
  cancelled:            { label: 'Cancelled',       color: 'red' },
  refunded:             { label: 'Refunded',        color: 'gray' },
  partially_refunded:   { label: 'Part Refunded',   color: 'gray' },
  no_show:              { label: 'No Show',         color: 'red' },
  completed:            { label: 'Completed',       color: 'green' },
};

export const SEAT_HOLD_MINUTES = 15;
export const MAX_PASSENGERS    = 9;
export const CHECKIN_OPENS_HOURS  = 48;
export const CHECKIN_CLOSES_HOURS = 1;

export const LOYALTY_TIERS = [
  { tier: 'bronze',   label: 'Bronze',   minPoints: 0,      color: '#cd7f32' },
  { tier: 'silver',   label: 'Silver',   minPoints: 10000,  color: '#c0c0c0' },
  { tier: 'gold',     label: 'Gold',     minPoints: 50000,  color: '#ffd700' },
  { tier: 'platinum', label: 'Platinum', minPoints: 150000, color: '#e5e4e2' },
] as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN:          '/api/auth/login',
    REGISTER:       '/api/auth/register',
    LOGOUT:         '/api/auth/logout',
    REFRESH:        '/api/auth/refresh',
    FORGOT_PW:      '/api/auth/forgot-password',
    RESET_PW:       '/api/auth/reset-password',
    VERIFY_EMAIL:   '/api/auth/verify-email',
    SETUP_2FA:      '/api/auth/2fa/setup',
    VERIFY_2FA:     '/api/auth/2fa/verify',
  },
  FLIGHTS: {
    SEARCH:         '/api/search/flights',
    DETAIL:         (id: string) => `/api/flights/${id}`,
    SEAT_MAP:       (id: string) => `/api/flights/${id}/seats`,
    AUTOCOMPLETE:   '/api/search/autocomplete',
  },
  BOOKINGS: {
    CREATE:         '/api/bookings',
    LIST:           '/api/bookings',
    DETAIL:         (ref: string) => `/api/bookings/${ref}`,
    CANCEL:         (ref: string) => `/api/bookings/${ref}/cancel`,
  },
  PAYMENTS: {
    INTENT:         '/api/payments/intent',
    CONFIRM:        '/api/payments/confirm',
    REFUND:         (id: string) => `/api/payments/${id}/refund`,
  },
  TICKETS: {
    LIST:           '/api/tickets',
    DETAIL:         (id: string) => `/api/tickets/${id}`,
    PDF:            (id: string) => `/api/tickets/${id}/pdf`,
  },
  CHECKIN: {
    INITIATE:       '/api/checkin',
    CONFIRM:        '/api/checkin/confirm',
    STATUS:         (ref: string) => `/api/checkin/${ref}`,
  },
  USER: {
    PROFILE:        '/api/users/me',
    UPDATE:         '/api/users/me',
    BOOKINGS:       '/api/users/me/bookings',
    TICKETS:        '/api/users/me/tickets',
    LOYALTY:        '/api/users/me/loyalty',
    NOTIFICATIONS:  '/api/users/me/notifications',
    DELETE_ACCOUNT: '/api/users/me',
  },
} as const;
