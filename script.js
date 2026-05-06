const DAILY_RATE = 12;
const BOOKING_FEE = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "skywayParkingReservation";
const PARKING_TYPE = "Self Uncovered";

const form = document.querySelector("#reservationForm");
const formErrors = document.querySelector("#formErrors");
const reservationSection = document.querySelector("#reservation");
const confirmation = document.querySelector("#confirmation");
const receipt = document.querySelector("#receipt");
const printButton = document.querySelector("#printReceipt");
const newReservationButton = document.querySelector("#newReservation");
const lateEstimateButton = document.querySelector("#estimateLateFee");

const fields = {
  fullName: document.querySelector("#fullName"),
  phone: document.querySelector("#phone"),
  email: document.querySelector("#email"),
  vehicleYear: document.querySelector("#vehicleYear"),
  vehicleMake: document.querySelector("#vehicleMake"),
  vehicleModel: document.querySelector("#vehicleModel"),
  licensePlate: document.querySelector("#licensePlate"),
  checkInDate: document.querySelector("#checkInDate"),
  checkInTime: document.querySelector("#checkInTime"),
  checkOutDate: document.querySelector("#checkOutDate"),
  checkOutTime: document.querySelector("#checkOutTime"),
  parkingType: document.querySelector("#parkingType"),
  agreementAccepted: document.querySelector("#agreementAccepted"),
  signatureName: document.querySelector("#signatureName"),
};

const priceSummary = {
  duration: document.querySelector("#summaryDuration"),
  subtotal: document.querySelector("#summarySubtotal"),
  total: document.querySelector("#summaryTotal"),
};

const money = (amount) =>
  amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ").toLowerCase();

function isValidDateObject(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function dateTimeFromInputs(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const dateMatch = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || hour > 23 || minute > 59) {
    return null;
  }

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);

  if (
    !isValidDateObject(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}

function currentDateRange() {
  const complete = Boolean(
    fields.checkInDate.value &&
      fields.checkInTime.value &&
      fields.checkOutDate.value &&
      fields.checkOutTime.value
  );

  return {
    complete,
    checkIn: dateTimeFromInputs(fields.checkInDate.value, fields.checkInTime.value),
    checkOut: dateTimeFromInputs(fields.checkOutDate.value, fields.checkOutTime.value),
  };
}

function calculateParkingPrice(checkIn, checkOut) {
  if (!isValidDateObject(checkIn) || !isValidDateObject(checkOut) || checkOut <= checkIn) {
    return {
      days: 0,
      subtotal: 0,
      bookingFee: BOOKING_FEE,
      total: 0,
      validRange: false,
    };
  }

  const days = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / DAY_MS));
  const subtotal = days * DAILY_RATE;

  return {
    days,
    subtotal,
    bookingFee: BOOKING_FEE,
    total: subtotal + BOOKING_FEE,
    validRange: true,
  };
}

function pluralDay(days) {
  return `${days} ${days === 1 ? "Day" : "Days"} of parking`;
}

function currentPricing() {
  const { checkIn, checkOut } = currentDateRange();
  return calculateParkingPrice(checkIn, checkOut);
}

function updatePriceSummary() {
  const range = currentDateRange();

  if (range.complete && (!range.checkIn || !range.checkOut || range.checkOut <= range.checkIn)) {
    priceSummary.duration.textContent = "Invalid date range";
    priceSummary.subtotal.textContent = "--";
    priceSummary.total.textContent = "--";
    return;
  }

  const pricing = currentPricing();
  const displayPricing = pricing.validRange
    ? pricing
    : {
        days: 1,
        subtotal: DAILY_RATE,
        total: DAILY_RATE + BOOKING_FEE,
      };

  priceSummary.duration.textContent = pluralDay(displayPricing.days);
  priceSummary.subtotal.textContent = money(displayPricing.subtotal);
  priceSummary.total.textContent = money(displayPricing.total);
}

function formatDateTime(date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimestamp(date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function randomReservationId() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function getFormValue(name) {
  return fields[name].value.trim();
}

function collectValidationErrors() {
  const errors = [];
  const requiredFieldLabels = [
    ["fullName", "Full name"],
    ["phone", "Phone number"],
    ["email", "Email address"],
    ["vehicleYear", "Vehicle year"],
    ["vehicleMake", "Vehicle make"],
    ["vehicleModel", "Vehicle model"],
    ["licensePlate", "License plate"],
    ["checkInDate", "Check-in date"],
    ["checkInTime", "Check-in time"],
    ["checkOutDate", "Check-out date"],
    ["checkOutTime", "Check-out time"],
  ];

  requiredFieldLabels.forEach(([name, label]) => {
    if (!getFormValue(name)) {
      errors.push(`${label} is required.`);
    }
  });

  if (fields.email.value && !fields.email.validity.valid) {
    errors.push("Enter a valid email address.");
  }

  const { complete, checkIn, checkOut } = currentDateRange();

  if (complete && (!checkIn || !checkOut)) {
    errors.push("Enter valid check-in and check-out dates and times.");
  } else if (checkIn && checkOut && checkOut <= checkIn) {
    errors.push("Check-out date and time must be after check-in date and time.");
  }

  if (!fields.agreementAccepted.checked) {
    errors.push("You must agree to the release / parking agreement.");
  }

  if (!getFormValue("signatureName")) {
    errors.push("Signature name is required.");
  } else if (
    getFormValue("fullName") &&
    normalizeName(getFormValue("signatureName")) !== normalizeName(getFormValue("fullName"))
  ) {
    errors.push("Signature name must match the full name on the reservation.");
  }

  return errors;
}

function showErrors(errors) {
  if (!errors.length) {
    formErrors.classList.remove("is-visible");
    formErrors.innerHTML = "";
    return;
  }

  formErrors.classList.add("is-visible");
  formErrors.innerHTML = `
    <strong>Please correct the following:</strong>
    <ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>
  `;
}

function createReservation() {
  const { checkIn, checkOut } = currentDateRange();
  const pricing = calculateParkingPrice(checkIn, checkOut);
  const acceptedAt = new Date();

  if (!pricing.validRange) {
    throw new Error("Invalid parking date range.");
  }

  return {
    reservationId: randomReservationId(),
    fullName: getFormValue("fullName"),
    phone: getFormValue("phone"),
    email: getFormValue("email"),
    vehicleYear: getFormValue("vehicleYear"),
    vehicleMake: getFormValue("vehicleMake"),
    vehicleModel: getFormValue("vehicleModel"),
    licensePlate: getFormValue("licensePlate").toUpperCase(),
    checkInISO: checkIn.toISOString(),
    checkOutISO: checkOut.toISOString(),
    parkingType: PARKING_TYPE,
    signatureName: getFormValue("signatureName"),
    acceptedAtISO: acceptedAt.toISOString(),
    pricing,
  };
}

function saveReservation(reservation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservation));
}

function renderReceipt(reservation) {
  const checkIn = new Date(reservation.checkInISO);
  const checkOut = new Date(reservation.checkOutISO);
  const acceptedAt = new Date(reservation.acceptedAtISO);
  const pricing = calculateParkingPrice(checkIn, checkOut);

  if (!pricing.validRange) {
    localStorage.removeItem(STORAGE_KEY);
    showErrors(["Saved reservation date range is invalid. Please submit a new reservation."]);
    return false;
  }

  const vehicle = `${reservation.vehicleYear} ${reservation.vehicleMake} ${reservation.vehicleModel}`;
  const daysText = pluralDay(pricing.days);
  const safeVehicle = escapeHtml(vehicle);
  const safe = Object.fromEntries(
    Object.entries(reservation).map(([key, value]) => [key, escapeHtml(value)])
  );

  receipt.innerHTML = `
    <div class="receipt-intro">
      <div class="receipt-intro-copy">
        <div class="receipt-brand">
          <img src="assets/logo.png" alt="Skyway Parking logo" class="receipt-logo" />
          <div>
            <p class="card-eyebrow">Reservation Receipt</p>
            <strong>Skyway Parking</strong>
          </div>
        </div>
        <p class="receipt-thank-you">Thank you ${safe.fullName}! Your airport parking has been booked and confirmed!</p>
      </div>
    </div>

    <section class="receipt-overview">
      <h2 class="receipt-overview-title">Reservation Overview</h2>

      <div class="receipt-main-grid">
        <div class="receipt-left-column">
          <section class="receipt-block">
            <h3>Reservation Details</h3>
            <div class="receipt-line"><strong>Reservation ID</strong><span>${safe.reservationId}</span></div>
            <div class="receipt-line"><strong>Reservation Made By</strong><span>${safe.fullName}</span></div>
            <div class="receipt-line"><strong>Reservation Status</strong><span>Open</span></div>
            <p class="receipt-copy">We have sent you a copy of this transaction to the email provided on checkout.</p>
          </section>

          <section class="receipt-block">
            <h3>Parking Lot Details</h3>
            <div class="receipt-lot-details">
              <img src="assets/logo.png" alt="Skyway Parking logo" class="receipt-lot-logo" />
              <div>
                <strong>Skyway Parking</strong>
                <span>8501 Inkster Rd., Taylor, MI, US, 48180</span>
                <a href="https://www.google.com/maps/search/?api=1&query=8501%20Inkster%20Rd%2C%20Taylor%2C%20MI%2048180" target="_blank" rel="noopener">Get Directions</a>
                <span>313-254-2699</span>
              </div>
            </div>
          </section>

          <section class="receipt-block">
            <h3>Your Parking Details</h3>
            <div class="receipt-line"><strong>Person Parking</strong><span>${safe.fullName}</span></div>
            <div class="receipt-line"><strong>Vehicle</strong><span>${safeVehicle}</span></div>
            <div class="receipt-line"><strong>License Plate</strong><span>${safe.licensePlate}</span></div>
            <div class="receipt-line"><strong>Check-in</strong><span>${escapeHtml(formatDateTime(checkIn))}</span></div>
            <div class="receipt-line"><strong>Check-out</strong><span>${escapeHtml(formatDateTime(checkOut))}</span></div>
            <div class="receipt-line"><strong>Parking Duration</strong><span>${daysText}</span></div>
            <div class="receipt-line"><strong>Parking Type</strong><span>${PARKING_TYPE}</span></div>
            <p class="receipt-proof-note">You must show a printed copy of your receipt at the parking lot.</p>
          </section>
        </div>

        <aside class="payment-card">
          <h3>Payment Breakdown</h3>
          <div class="payment-row">
            <span>Parking Price (${daysText})</span>
            <strong>${money(pricing.subtotal)}</strong>
          </div>
          <div class="payment-row">
            <span>Booking Fee</span>
            <strong>$5.00</strong>
          </div>
          <div class="payment-row payment-total">
            <span>Total</span>
            <strong>${money(pricing.total)}</strong>
          </div>
          <div class="payment-row">
            <span>You Paid</span>
            <strong>${money(pricing.total)}</strong>
          </div>
          <p class="payment-copy">You were charged ${money(pricing.total)} USD for this transaction.</p>
          <div class="payment-row">
            <span>Remaining Due at Parking Lot</span>
            <strong>$0.00</strong>
          </div>
        </aside>
      </div>
    </section>

    <section class="receipt-section">
      <h3>For Parking Lot Use Only</h3>
      <h4>Payment Summary</h4>
      <div class="receipt-line"><strong>Remaining Balance Due</strong><span>$0.00</span></div>
      <div class="receipt-line"><strong>Guaranteed Daily Rate</strong><span>$12.00</span></div>
      <h4>Cashier Instructions</h4>
      <p>Cashier: This is a pre-paid reservation. If the customer's length of stay matches the itinerary above, there is no charge to the customer.</p>
    </section>

    <section class="receipt-section">
      <h3>Customer Information</h3>
      <div class="receipt-grid">
        <div class="receipt-line"><strong>Name</strong><span>${safe.fullName}</span></div>
        <div class="receipt-line"><strong>Phone</strong><span>${safe.phone}</span></div>
        <div class="receipt-line"><strong>Email</strong><span>${safe.email}</span></div>
        <div class="receipt-line"><strong>Vehicle year/make/model</strong><span>${safeVehicle}</span></div>
        <div class="receipt-line"><strong>License plate</strong><span>${safe.licensePlate}</span></div>
        <div class="receipt-line"><strong>Signature name</strong><span>${safe.signatureName}</span></div>
        <div class="receipt-line"><strong>Agreement accepted timestamp</strong><span>${escapeHtml(formatTimestamp(acceptedAt))}</span></div>
      </div>
    </section>

    <section class="receipt-section">
      <h3>How Changes Affect Total</h3>
      <p>Because this is an exclusive rate, it cannot be combined with other coupons, offers, discounts, or promotions.</p>
    </section>

    <section class="receipt-section">
      <h3>Cancellation / Changes</h3>
      <p>You may cancel your reservation for a full refund, including the booking fee, within the first 24 hours after your reservation was originally submitted. Reservations canceled after 24 hours will not be refunded the booking fee.</p>
      <p>We are unable to accept cancellations after the scheduled parking arrival date, nor can we make any changes to an existing reservation. Partial refunds are not issued for schedule changes or early returns.</p>
      <p>You can cancel your reservation directly from our Help page, or contact us.</p>
    </section>

    <section class="receipt-section">
      <h3>Parking Lot Details</h3>
      <h4>Transportation</h4>
      <p>24/7 on-demand shuttle service.</p>
      <h4>Arrival and Airport Pickup Info</h4>
      <p>Upon arriving, before parking, stop in the main office. Register at the front desk. Have your ID and your plate number ready. Once you have registered, park in any open parking spot. Staff will assist with the shuttle.</p>
    </section>
  `;

  reservationSection.classList.add("is-hidden");
  confirmation.classList.remove("is-hidden");
  confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function handleSubmit(event) {
  event.preventDefault();
  const errors = collectValidationErrors();
  showErrors(errors);

  if (errors.length) {
    return;
  }

  let reservation;

  try {
    reservation = createReservation();
  } catch {
    showErrors(["Check-out date and time must be after check-in date and time."]);
    return;
  }

  saveReservation(reservation);
  form.reset();
  fields.parkingType.value = PARKING_TYPE;
  updatePriceSummary();
  window.history.replaceState(null, "", "#confirmation");
  renderReceipt(reservation);
}

function startNewReservation() {
  localStorage.removeItem(STORAGE_KEY);
  receipt.innerHTML = "";
  confirmation.classList.add("is-hidden");
  reservationSection.classList.remove("is-hidden");
  form.reset();
  fields.parkingType.value = PARKING_TYPE;
  updatePriceSummary();
  window.history.replaceState(null, "", "#reservation");
  document.querySelector("#reservation").scrollIntoView({ behavior: "smooth", block: "start" });
}

function calculateLateCharge(scheduledReturn, actualReturn) {
  if (!scheduledReturn || !actualReturn) {
    return null;
  }

  const lateMs = actualReturn.getTime() - scheduledReturn.getTime();
  if (lateMs <= 0) {
    return {
      amount: 0,
      message: "On-time or early return. No additional parking charge.",
    };
  }

  const lateHours = lateMs / (60 * 60 * 1000);

  if (lateHours <= 1) {
    return {
      amount: 0,
      message: "First hour late is complimentary. No additional booking fee.",
    };
  }

  if (lateHours <= 4) {
    return {
      amount: 6,
      message: "More than 1 hour and up to 4 hours late. No additional booking fee.",
    };
  }

  const additionalLateDays = Math.max(0, Math.ceil((lateHours - 24) / 24));
  const amount = DAILY_RATE + additionalLateDays * DAILY_RATE;
  const dayMessage =
    additionalLateDays > 0
      ? ` Includes ${additionalLateDays} additional late ${additionalLateDays === 1 ? "day" : "days"} at $12/day.`
      : "";

  return {
    amount,
    message: `More than 4 hours late. No additional booking fee.${dayMessage}`,
  };
}

function updateLateEstimate() {
  const scheduledValue = document.querySelector("#scheduledReturn").value;
  const actualValue = document.querySelector("#actualReturn").value;
  const result = document.querySelector("#lateResult");

  const scheduledReturn = scheduledValue ? new Date(scheduledValue) : null;
  const actualReturn = actualValue ? new Date(actualValue) : null;
  const estimate = calculateLateCharge(scheduledReturn, actualReturn);

  if (!estimate) {
    result.textContent = "Enter return times to estimate any additional parking charge.";
    return;
  }

  result.textContent = `Estimated late charge: ${money(estimate.amount)}. ${estimate.message}`;
}

function restoreSavedReceipt() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved || window.location.hash !== "#confirmation") {
    return;
  }

  try {
    if (!renderReceipt(JSON.parse(saved))) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

form.addEventListener("submit", handleSubmit);
Object.values(fields).forEach((field) => {
  if (field && ["date", "time"].includes(field.type)) {
    field.addEventListener("input", updatePriceSummary);
  }
});

printButton.addEventListener("click", () => window.print());
newReservationButton.addEventListener("click", startNewReservation);
lateEstimateButton.addEventListener("click", updateLateEstimate);
document.querySelector("#scheduledReturn").addEventListener("input", updateLateEstimate);
document.querySelector("#actualReturn").addEventListener("input", updateLateEstimate);

fields.parkingType.value = PARKING_TYPE;
updatePriceSummary();
restoreSavedReceipt();
