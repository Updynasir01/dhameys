const dayjs = require('dayjs');

function safeNum(n, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : d;
}

function normalizeCabin(cabin) {
  const c = String(cabin || '').toLowerCase();
  if (c === 'economy' || c === 'e') return 'economy';
  if (c === 'premium_economy' || c === 'premium economy' || c === 'pe') return 'premium_economy';
  if (c === 'business' || c === 'c') return 'business';
  if (c === 'first' || c === 'f') return 'first';
  return 'economy';
}

/**
 * Mapper that converts Mystifly search results into the Dhameys "Flight" shape used by the frontend.
 *
 * Because Mystifly response shapes vary by product (REST / SOAP gateway / NDC),
 * this mapper is defensive: it supports a few common keys and falls back to throwing
 * a clear error if no recognizable list is found.
 *
 * Returned objects are *not* Mongoose docs — they are plain objects that can be persisted.
 */
function mapSearchToFlightOptions(raw, query) {
  const list =
    raw?.data?.flights ||
    raw?.flights ||
    raw?.Data?.Flights ||
    raw?.Data?.Results ||
    raw?.Results ||
    [];

  if (!Array.isArray(list)) {
    throw Object.assign(new Error('Unrecognized Mystifly search response (no flight list found)'), { status: 502 });
  }

  // We try to interpret each item as a single "direct flight option" for now.
  // Multi-segment itineraries can be added later by expanding providerMeta and mapping segments.
  return list.map((it) => {
    const originIata = String(it.origin || it.originIata || it.Origin || it.OriginCode || query.origin || '').toUpperCase();
    const destIata = String(it.destination || it.destIata || it.Destination || it.DestinationCode || query.destination || '').toUpperCase();

    const dep = it.departureTime || it.departure || it.DepartureTime || it.DepartureDateTime;
    const arr = it.arrivalTime || it.arrival || it.ArrivalTime || it.ArrivalDateTime;

    const departureTime = dep ? new Date(dep) : new Date(query.departureDate + 'T09:00:00.000Z');
    const arrivalTime = arr ? new Date(arr) : new Date(departureTime.getTime() + 2 * 3600000);
    const durationMin = it.durationMin || it.duration || it.DurationMinutes || Math.max(0, Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60000));

    const providerFlightId =
      String(it.id || it.flightId || it.FlightId || it.ResultId || it.TraceId || `${originIata}-${destIata}-${dayjs(departureTime).format('YYYYMMDDHHmm')}`);

    const flightNumber = String(it.flightNumber || it.FlightNumber || it.marketingFlightNumber || it.MarketingFlightNumber || it.airlineCode || 'DH') + String(it.flightNo || it.FlightNo || '');

    const faresRaw = it.fares || it.Fares || it.prices || it.Prices || it.Offers || [];
    const fares = (Array.isArray(faresRaw) ? faresRaw : [faresRaw]).filter(Boolean).map((f) => {
      const cabinClass = normalizeCabin(f.cabinClass || f.CabinClass || f.cabin || f.Cabin || query.cabinClass);
      const currency = String(f.currency || f.Currency || 'USD');
      const basePrice = safeNum(f.basePrice ?? f.BasePrice ?? f.price ?? f.Price ?? 0);
      const taxAmount = safeNum(f.taxAmount ?? f.TaxAmount ?? f.taxes ?? f.Taxes ?? 0);
      const fuelSurcharge = safeNum(f.fuelSurcharge ?? f.FuelSurcharge ?? 0);
      const serviceFee = safeNum(f.serviceFee ?? f.ServiceFee ?? 15, 15);
      const seatsAvailable = safeNum(f.seatsAvailable ?? f.SeatsAvailable ?? 9, 9);
      const seatsTotal = safeNum(f.seatsTotal ?? f.SeatsTotal ?? seatsAvailable, seatsAvailable);
      const refundable = Boolean(f.refundable ?? f.Refundable ?? false);
      const changeable = Boolean(f.changeable ?? f.Changeable ?? false);
      const changeFee = safeNum(f.changeFee ?? f.ChangeFee ?? 0);

      const providerFareId = String(f.providerFareId || f.FareId || f.fareId || f.FareKey || f.fareKey || f.FareBasis || f.fareBasis || '');

      return {
        cabinClass,
        basePrice,
        taxAmount,
        fuelSurcharge,
        serviceFee,
        currency,
        seatsAvailable,
        seatsTotal,
        fareCode: providerFareId || String(f.fareCode || f.FareCode || ''),
        providerFareId: providerFareId || undefined,
        refundable,
        changeable,
        changeFee,
        milesEarned: safeNum(f.milesEarned ?? f.MilesEarned ?? 0, 0) || undefined,
        isActive: true,
        providerMeta: f,
      };
    });

    return {
      provider: 'mystifly',
      providerFlightId,
      providerMeta: it,

      flightNumber,
      originIata,
      destIata,
      originCity: it.originCity || it.OriginCity,
      destCity: it.destCity || it.DestinationCity,
      originName: it.originName || it.OriginName,
      destName: it.destName || it.DestinationName,
      departureTime,
      arrivalTime,
      durationMin,
      aircraftType: it.aircraftType || it.AircraftType,

      checkedBaggageKg: safeNum(it.checkedBaggageKg ?? it.CheckedBaggageKg ?? 23, 23),
      cabinBaggageKg: safeNum(it.cabinBaggageKg ?? it.CabinBaggageKg ?? 7, 7),

      status: String(it.status || 'scheduled'),

      fares,
    };
  });
}

function mapFareRulesResponse(raw) {
  // Mystifly may return text, HTML, or structured rules.
  const rules =
    raw?.data?.rules ||
    raw?.rules ||
    raw?.Data?.Rules ||
    raw?.FareRules ||
    raw?.RuleText ||
    raw?.Text;

  if (!rules) {
    return { format: 'unknown', rules: null, raw };
  }

  if (typeof rules === 'string') {
    const isHtml = /<\/?[a-z][\s\S]*>/i.test(rules);
    return { format: isHtml ? 'html' : 'text', rules, raw };
  }

  return { format: 'json', rules, raw };
}

module.exports = { mapSearchToFlightOptions, mapFareRulesResponse };

