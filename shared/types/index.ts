// shared/types/index.ts
// Dhameys Airlines — Shared Types

// ─── Enums ─────────────────────────────────────────────────────────────────

export type UserRole    = 'customer' | 'agent' | 'admin' | 'superadmin';
export type UserStatus  = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type Gender      = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type Title       = 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof';

export type FlightStatus =
  | 'scheduled' | 'delayed' | 'boarding' | 'departed'
  | 'in_air' | 'landed' | 'arrived' | 'cancelled' | 'diverted';

export type CabinClass   = 'economy' | 'premium_economy' | 'business' | 'first';
export type SeatType     = 'window' | 'middle' | 'aisle';
export type SeatStatus   = 'available' | 'locked' | 'booked' | 'blocked' | 'unavailable';

export type BookingStatus =
  | 'pending' | 'confirmed' | 'cancelled'
  | 'refunded' | 'partially_refunded' | 'no_show' | 'completed';

export type BookingType   = 'one_way' | 'round_trip' | 'multi_city';
export type PassengerType = 'adult' | 'child' | 'infant';

export type PaymentStatus =
  | 'pending' | 'processing' | 'completed' | 'failed'
  | 'refunded' | 'partially_refunded' | 'disputed' | 'cancelled';

export type PaymentMethod =
  | 'credit_card' | 'debit_card' | 'paypal'
  | 'bank_transfer' | 'wallet' | 'loyalty_points' | 'stripe';

export type TicketStatus  = 'issued' | 'used' | 'cancelled' | 'expired' | 'reissued';
export type CheckinStatus = 'not_checked_in' | 'checked_in' | 'boarded';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'KWD' | 'QAR' | string;

export type AddonType =
  | 'extra_baggage' | 'cabin_baggage' | 'meal' | 'seat_upgrade'
  | 'travel_insurance' | 'lounge_access' | 'priority_boarding'
  | 'fast_track_security' | 'car_rental' | 'hotel';

// ─── User ──────────────────────────────────────────────────────────────────

export interface User {
  id:                 string;
  email:              string;
  phone?:             string;
  role:               UserRole;
  status:             UserStatus;
  title?:             Title;
  firstName:          string;
  lastName:           string;
  fullName:           string;
  dateOfBirth?:       string;
  gender?:            Gender;
  nationality?:       string;
  avatarUrl?:         string;
  passportNumber?:    string;
  passportExpiry?:    string;
  passportCountry?:   string;
  preferredCurrency:  Currency;
  preferredLanguage:  string;
  preferredCabin:     CabinClass;
  twoFaEnabled:       boolean;
  loyaltyPoints:      number;
  loyaltyTier:        string;
  emailVerified:      boolean;
  gdprConsent:        boolean;
  marketingConsent:   boolean;
  lastLogin?:         string;
  createdAt:          string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface AuthResponse {
  user:   User;
  tokens: AuthTokens;
}

// ─── Airport ───────────────────────────────────────────────────────────────

export interface Airport {
  id:           string;
  iataCode:     string;
  icaoCode?:    string;
  name:         string;
  city:         string;
  country:      string;
  countryName:  string;
  timezone:     string;
  latitude?:    number;
  longitude?:   number;
}

// ─── Flight ────────────────────────────────────────────────────────────────

export interface Flight {
  id:                 string;
  flightNumber:       string;
  origin:             Airport;
  destination:        Airport;
  departureTime:      string;
  arrivalTime:        string;
  durationMin:        number;
  status:             FlightStatus;
  delayMinutes:       number;
  departureTerminal?: string;
  arrivalTerminal?:   string;
  departureGate?:     string;
  arrivalGate?:       string;
  aircraftType?:      string;
  checkedBaggageKg:   number;
  cabinBaggageKg:     number;
  isCodeshare:        boolean;
  fares:              FareRule[];
  economyAvailable:   number;
  premiumAvailable:   number;
  businessAvailable:  number;
  firstAvailable:     number;
}

export interface FareRule {
  id:               string;
  cabinClass:       CabinClass;
  basePrice:        number;
  taxAmount:        number;
  fuelSurcharge:    number;
  serviceFee:       number;
  totalPrice:       number;
  currency:         Currency;
  seatsAvailable:   number;
  fareCode:         string;
  refundable:       boolean;
  changeable:       boolean;
  changeFee:        number;
  milesEarned:      number;
}

// ─── Search ────────────────────────────────────────────────────────────────

export interface FlightSearchParams {
  origin:          string;   // IATA
  destination:     string;   // IATA
  departureDate:   string;   // YYYY-MM-DD
  returnDate?:     string;   // YYYY-MM-DD
  cabinClass:      CabinClass;
  adults:          number;
  children:        number;
  infants:         number;
  tripType:        BookingType;
}

export interface FlightSearchResult {
  outbound:        Flight[];
  inbound?:        Flight[];
  total:           number;
  aggregations:    {
    minPrice:      number;
    maxPrice:      number;
  };
}

// ─── Booking ───────────────────────────────────────────────────────────────

export interface Passenger {
  id?:               string;
  passengerType:     PassengerType;
  title?:            Title;
  firstName:         string;
  lastName:          string;
  dateOfBirth?:      string;
  nationality?:      string;
  passportNumber?:   string;
  passportExpiry?:   string;
  passportCountry?:  string;
  mealPreference?:   string;
  specialAssistance?: string;
  frequentFlyerNo?:  string;
}

export interface SeatAssignment {
  passengerId: string;
  seatCode:    string;
  flightId:    string;
}

export interface BookingAddon {
  addonId:   string;
  quantity:  number;
  passengerId?: string;
}

export interface CreateBookingRequest {
  tripType:         BookingType;
  outboundFlightId: string;
  returnFlightId?:  string;
  cabinClass:       CabinClass;
  fareRuleId:       string;
  passengers:       Passenger[];
  seatAssignments?: SeatAssignment[];
  addons?:          BookingAddon[];
  contactEmail:     string;
  contactPhone?:    string;
  promoCode?:       string;
  loyaltyPointsToUse?: number;
}

export interface Booking {
  id:                  string;
  bookingRef:          string;
  tripType:            BookingType;
  status:              BookingStatus;
  flights:             BookingFlight[];
  passengers:          Passenger[];
  seatAssignments:     SeatAssignment[];
  addons:              BookingAddon[];
  subtotal:            number;
  taxTotal:            number;
  addonTotal:          number;
  discountTotal:       number;
  totalAmount:         number;
  currency:            Currency;
  promoCode?:          string;
  contactEmail:        string;
  contactPhone?:       string;
  loyaltyPointsEarned: number;
  confirmedAt?:        string;
  createdAt:           string;
}

export interface BookingFlight {
  id:          string;
  flight:      Flight;
  cabinClass:  CabinClass;
  fareRule:    FareRule;
  segmentOrder: number;
}

// ─── Payment ───────────────────────────────────────────────────────────────

export interface PaymentIntent {
  clientSecret:    string;
  paymentIntentId: string;
  amount:          number;
  currency:        Currency;
}

export interface Payment {
  id:           string;
  paymentRef:   string;
  bookingId:    string;
  amount:       number;
  currency:     Currency;
  status:       PaymentStatus;
  method:       PaymentMethod;
  cardLast4?:   string;
  cardBrand?:   string;
  paidAt?:      string;
  createdAt:    string;
}

// ─── Ticket ────────────────────────────────────────────────────────────────

export interface Ticket {
  id:             string;
  ticketNumber:   string;
  bookingId:      string;
  passenger:      Passenger;
  flight:         Flight;
  seatCode?:      string;
  status:         TicketStatus;
  checkinStatus:  CheckinStatus;
  barcodeData?:   string;
  boardingGroup?: string;
  boardingTime?:  string;
  pdfUrl?:        string;
  pnrCode?:       string;
  issuedAt:       string;
}

// ─── API Responses ─────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success:  boolean;
  data?:    T;
  error?:   string;
  message?: string;
  meta?: {
    total:   number;
    page:    number;
    limit:   number;
    pages:   number;
  };
}

export interface PaginationParams {
  page?:   number;
  limit?:  number;
  sortBy?: string;
  order?:  'asc' | 'desc';
}

// ─── Seat Map ──────────────────────────────────────────────────────────────

export interface SeatMapRow {
  rowNumber:  number;
  seats:      SeatMapSeat[];
}

export interface SeatMapSeat {
  id:             string;
  seatCode:       string;
  letter:         string;
  cabinClass:     CabinClass;
  seatType:       SeatType;
  status:         SeatStatus;
  hasExtraLegroom: boolean;
  isExitRow:      boolean;
  isBassinet:     boolean;
  price?:         number;
}

// ─── Addons ────────────────────────────────────────────────────────────────

export interface Addon {
  id:             string;
  type:           AddonType;
  name:           string;
  description?:   string;
  price:          number;
  currency:       Currency;
  isPerPassenger: boolean;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export interface Notification {
  id:        string;
  type:      string;
  subject?:  string;
  body?:     string;
  isRead:    boolean;
  createdAt: string;
}
