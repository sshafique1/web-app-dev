/* ==========================================================
   restaurant.js - Problem-Solving Page (Aurum case study)
   Features
     - accessible tabbed digital menu
     - promotion countdown timer
     - interactive loyalty stamp card demo
     - booking / feedback form with client-side validation
     - generates a pre-filled email (mailto) from the user's input
       so no live database is needed, as the brief requires
   ========================================================== */

"use strict";

const RESTAURANT_EMAIL = "reservations@aurum-manchester.co.uk"; // fictional address

document.addEventListener("DOMContentLoaded", function () {
  initMenuTabs();
  initCountdown();
  initLoyalty();
  initBookingForm();
});

/* ---------- Digital menu tabs (WAI-ARIA tabs pattern) ---------- */
function initMenuTabs() {
  const tabs = Array.from(document.querySelectorAll(".menu-tabs [role='tab']"));
  if (tabs.length === 0) {
    return;
  }

  function select(tab) {
    tabs.forEach(function (t) {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      select(tab);
    });

    // arrow keys move between tabs
    tab.addEventListener("keydown", function (e) {
      let next = null;
      if (e.key === "ArrowRight") {
        next = tabs[(i + 1) % tabs.length];
      } else if (e.key === "ArrowLeft") {
        next = tabs[(i - 1 + tabs.length) % tabs.length];
      }
      if (next) {
        e.preventDefault();
        next.focus();
        select(next);
      }
    });
  });
}

/* ---------- Countdown to the next tasting-menu event ---------- */
function initCountdown() {
  const box = document.querySelector(".countdown");
  if (!box) {
    return;
  }

  // next Friday at 19:00 local time
  const target = new Date();
  target.setDate(target.getDate() + ((5 - target.getDay() + 7) % 7 || 7));
  target.setHours(19, 0, 0, 0);

  const parts = {
    days: box.querySelector("[data-unit='days']"),
    hours: box.querySelector("[data-unit='hours']"),
    mins: box.querySelector("[data-unit='mins']"),
    secs: box.querySelector("[data-unit='secs']")
  };

  function update() {
    const diff = Math.max(target - new Date(), 0);
    parts.days.textContent = Math.floor(diff / 86400000);
    parts.hours.textContent = Math.floor(diff / 3600000) % 24;
    parts.mins.textContent = Math.floor(diff / 60000) % 60;
    parts.secs.textContent = Math.floor(diff / 1000) % 60;
  }
  update();
  setInterval(update, 1000);
}

/* ---------- Loyalty stamp card demo ---------- */
function initLoyalty() {
  const btn = document.getElementById("add-stamp");
  const stamps = document.querySelectorAll(".stamp");
  const status = document.getElementById("loyalty-status");
  if (!btn || stamps.length === 0) {
    return;
  }

  let count = 0;

  btn.addEventListener("click", function () {
    if (count >= stamps.length) {
      // reset the card after the reward has been shown
      count = 0;
      stamps.forEach(function (s) {
        s.classList.remove("filled");
      });
      status.textContent = "Card reset. Start collecting again.";
      btn.textContent = "Simulate a visit";
      return;
    }

    stamps[count].classList.add("filled");
    count += 1;

    if (count === stamps.length) {
      status.textContent = "Reward unlocked. A complimentary chef's tasting course on your next visit.";
      btn.textContent = "Reset card";
    } else {
      status.textContent = (stamps.length - count) + " more visit(s) until your reward.";
    }
  });
}

/* ---------- Booking and feedback form ---------- */
function initBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) {
    return;
  }

  const typeRadios = form.querySelectorAll("input[name='enquiry']");
  const bookingFields = document.getElementById("booking-fields");
  const dateInput = form.elements.date;
  const status = document.getElementById("form-status");
  const preview = document.getElementById("email-preview");

  // stop people choosing a date in the past
  dateInput.min = new Date().toISOString().split("T")[0];

  // show booking-only fields only when "Table booking" is chosen
  typeRadios.forEach(function (radio) {
    radio.addEventListener("change", toggleBookingFields);
  });

  function toggleBookingFields() {
    const isBooking = form.elements.enquiry.value === "Table booking";
    bookingFields.hidden = !isBooking;
  }
  toggleBookingFields();

  // live validation as the user leaves each field
  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("blur", function () {
      validateField(field);
    });
  });

  // live character counter on the message box
  const message = form.elements.message;
  const counter = document.getElementById("char-count");
  message.addEventListener("input", function () {
    counter.textContent = message.value.length + " / 500";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const fields = Array.from(form.querySelectorAll("input, select, textarea"));
    const results = fields.map(validateField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      showStatus("Please fix the highlighted fields before sending.", "error");
      const firstBad = form.querySelector(".invalid input, .invalid select, .invalid textarea");
      if (firstBad) {
        firstBad.focus();
      }
      return;
    }

    const email = buildEmail(form);
    preview.textContent = "To - " + RESTAURANT_EMAIL + "\nSubject - " + email.subject + "\n\n" + email.body;
    preview.hidden = false;

    showStatus("Your email is ready. Your mail app should now open with everything filled in.", "success");

    // open the visitor's email client with the generated message
    window.location.href = "mailto:" + RESTAURANT_EMAIL +
      "?subject=" + encodeURIComponent(email.subject) +
      "&body=" + encodeURIComponent(email.body);
  });

  form.addEventListener("reset", function () {
    form.querySelectorAll(".field").forEach(function (f) {
      f.classList.remove("invalid");
    });
    form.querySelectorAll(".error-msg").forEach(function (m) {
      m.textContent = "";
    });
    preview.hidden = true;
    status.className = "form-status";
    counter.textContent = "0 / 500";
    setTimeout(toggleBookingFields, 0);
  });

  function showStatus(text, type) {
    status.textContent = text;
    status.className = "form-status show " + type;
  }
}

/* Checks one field and shows a helpful error message underneath it.
   Returns true if the field is valid. */
function validateField(field) {
  const wrapper = field.closest(".field");
  if (!wrapper || field.closest("[hidden]")) {
    return true; // hidden booking fields are skipped
  }

  const error = wrapper.querySelector(".error-msg");
  const value = field.value.trim();
  let message = "";

  if (field.required && field.type === "checkbox" && !field.checked) {
    message = "You need to agree to the privacy notice.";
  } else if (field.required && value === "") {
    message = "This field is required.";
  } else if (field.name === "name" && !/^[A-Za-z][A-Za-z '\-]{1,59}$/.test(value)) {
    message = "Enter your full name using letters only.";
  } else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    message = "Enter a valid email such as name@example.com.";
  } else if (field.type === "tel" && value !== "" && !/^(\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/.test(value)) {
    message = "Enter a UK mobile number such as 07123 456789.";
  } else if (field.name === "guests" && (value < 1 || value > 12)) {
    message = "Bookings are for 1 to 12 guests. Call us for larger parties.";
  } else if (field.name === "date" && value !== "" && value < field.min) {
    message = "Please choose today or a future date.";
  }

  wrapper.classList.toggle("invalid", message !== "");
  if (error) {
    error.textContent = message;
  }
  return message === "";
}

/* Turns the form values into a readable email subject and body */
function buildEmail(form) {
  const data = new FormData(form);
  const type = data.get("enquiry");
  const name = data.get("name").trim();
  const lines = [
    "Dear Aurum team,",
    "",
    "Enquiry type - " + type,
    "Name - " + name,
    "Email - " + data.get("email").trim()
  ];

  if (data.get("phone").trim() !== "") {
    lines.push("Phone - " + data.get("phone").trim());
  }

  if (type === "Table booking") {
    lines.push(
      "Date - " + data.get("date"),
      "Time - " + data.get("time"),
      "Guests - " + data.get("guests"),
      "Occasion - " + (data.get("occasion") || "None")
    );
  }

  lines.push(
    "",
    "Message",
    data.get("message").trim() || "No additional message.",
    "",
    "Marketing emails - " + (data.get("marketing") ? "Yes please" : "No thanks"),
    "",
    "Kind regards,",
    name
  );

  const subject = type === "Table booking"
    ? "Table booking request for " + data.get("guests") + " on " + data.get("date")
    : type + " from " + name;

  return { subject: subject, body: lines.join("\n") };
}
