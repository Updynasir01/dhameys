// src/store/bookingStore.ts
import { create } from 'zustand';
import type { Flight, FareRule, Passenger, Addon, CabinClass, BookingType } from '../../../shared/types';

export interface SearchParams {
  origin:        string;
  destination:   string;
  departureDate: string;
  returnDate?:   string;
  adults:        number;
  children:      number;
  infants:       number;
  cabinClass:    CabinClass;
  tripType:      BookingType;
}

interface BookingState {
  // Search
  searchParams:     SearchParams | null;
  searchResults:    Flight[] | null;
  returnResults:    Flight[] | null;
  isSearching:      boolean;

  // Selection
  selectedOutbound: Flight | null;
  selectedReturn:   Flight | null;
  selectedFare:     FareRule | null;
  selectedSeats:    Record<string, string>; // passengerId -> seatCode

  // Passengers
  passengers:       Passenger[];

  // Add-ons
  selectedAddons:   Addon[];

  // Booking ref (after create)
  bookingRef:       string | null;
  bookingId:        string | null;

  // Contact
  contactEmail:     string;
  contactPhone:     string;
  promoCode:        string;

  setSearchParams:      (p: SearchParams) => void;
  setSearchResults:     (outbound: Flight[], inbound?: Flight[]) => void;
  setSearching:         (v: boolean) => void;
  selectOutbound:       (f: Flight) => void;
  selectReturn:         (f: Flight) => void;
  selectFare:           (f: FareRule) => void;
  setSeat:              (passengerId: string, seatCode: string) => void;
  setPassengers:        (p: Passenger[]) => void;
  setSelectedAddons:    (a: Addon[]) => void;
  setBookingRef:        (ref: string, id: string) => void;
  setContact:           (email: string, phone: string) => void;
  setPromoCode:         (code: string) => void;
  resetBooking:         () => void;
}

const defaultSearch: SearchParams = {
  origin: '', destination: '', departureDate: '',
  adults: 1, children: 0, infants: 0,
  cabinClass: 'economy', tripType: 'one_way',
};

export const useBookingStore = create<BookingState>((set) => ({
  searchParams:     null,
  searchResults:    null,
  returnResults:    null,
  isSearching:      false,
  selectedOutbound: null,
  selectedReturn:   null,
  selectedFare:     null,
  selectedSeats:    {},
  passengers:       [],
  selectedAddons:   [],
  bookingRef:       null,
  bookingId:        null,
  contactEmail:     '',
  contactPhone:     '',
  promoCode:        '',

  setSearchParams:   (p)    => set({ searchParams: p }),
  setSearchResults:  (o, i) => set({ searchResults: o, returnResults: i || null }),
  setSearching:      (v)    => set({ isSearching: v }),
  selectOutbound:    (f)    => set({ selectedOutbound: f }),
  selectReturn:      (f)    => set({ selectedReturn: f }),
  selectFare:        (f)    => set({ selectedFare: f }),
  setSeat:           (pid, code) => set(s => ({ selectedSeats: { ...s.selectedSeats, [pid]: code } })),
  setPassengers:     (p)    => set({ passengers: p }),
  setSelectedAddons: (a)    => set({ selectedAddons: a }),
  setBookingRef:     (ref, id) => set({ bookingRef: ref, bookingId: id }),
  setContact:        (email, phone) => set({ contactEmail: email, contactPhone: phone }),
  setPromoCode:      (code) => set({ promoCode: code }),
  resetBooking:      () => set({
    selectedOutbound: null, selectedReturn: null, selectedFare: null,
    selectedSeats: {}, passengers: [], selectedAddons: [],
    bookingRef: null, bookingId: null, promoCode: '',
  }),
}));
