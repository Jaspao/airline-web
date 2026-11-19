"use strict";

const USERS = [
    { username: "demo", password: "1234", name:"John Doe"},
    { username: "jason", password: "pass", name:"Jason Seb"},
];

const FLIGHTS = [
  { id: "F1", number: "SB101", plane: "9M-SBA", aircraft: "Airbus A320", from: "Kuala Lumpur", to: "Bali",         depart: "2026-10-25T08:30", arrive: "2026-10-25T11:45", price: 120 },
  { id: "F2", number: "SB202", plane: "9M-SBB", aircraft: "Boeing 737",  from: "Kuala Lumpur", to: "Tokyo",        depart: "2026-10-26T23:10", arrive: "2026-10-27T07:00", price: 340 },
  { id: "F3", number: "SB303", plane: "9M-SBC", aircraft: "Airbus A320", from: "Bali",         to: "Singapore",    depart: "2026-10-27T14:00", arrive: "2026-10-27T16:40", price: 95  },
  { id: "F4", number: "SB404", plane: "9M-SBD", aircraft: "Boeing 737",  from: "Singapore",    to: "Kuala Lumpur", depart: "2026-10-28T06:15", arrive: "2026-10-28T07:20", price: 60  },
  { id: "F5", number: "SB505", plane: "9M-SBE", aircraft: "Airbus A321", from: "Tokyo",        to: "Kuala Lumpur", depart: "2026-10-30T10:00", arrive: "2026-10-30T16:30", price: 360 },
  { id: "F6", number: "SB606", plane: "9M-SBF", aircraft: "Airbus A321", from: "Kuala Lumpur", to: "Singapore",    depart: "2026-11-01T18:45", arrive: "2026-11-01T19:50", price: 70  },
];

const ROWS = 10;                          // seat rows on every plane
const COLS = ["A", "B", "C", "D", "E", "F"];
const STORAGE_BOOKINGS = "jaspair_bookings";

const STORAGE_SESSION = "jaspair_session";

const state = {
    user: null,
    flight: null,
    passenger: "",
    seat: null,
    bag: null,
};

const $ = (sel) => document.querySelector(sel);

function esc(text){
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;

}

function formatDate(iso){
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short"})
}

function money(n){
    return "$" + n.toFixed(2);
}

function getBookings(){
    try{
        return JSON.parse(localStorage.getItem(STORAGE_BOOKINGS)) || [];
    } catch {
        return [];
    }
}

// Small seeded random generator: same seed text → same sequence every time.
// Treat it as a black box: it lets each flight have the same pre-taken seats on every refresh.
function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The set of seat IDs that are unavailable, like "3B"
function takenSeats(flight) {
  const taken = new Set();
  const rand = seededRandom(flight.id);
  for (let r = 1; r <= ROWS; r++) {
    for (const c of COLS) {
      if (rand() < 0.35) taken.add(r + c);   // about 35% pre-booked
    }
  }
  getBookings()
    .filter((b) => b.flightId === flight.id)
    .forEach((b) => taken.add(b.seat));       // plus seats this browser has booked
  return taken;
}

/* navigation stuffs */
const STEP_OF_VIEW = {flights:1, booking:2, seats:3, baggage:4, ticket:5};

function showView(name){
    document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
    $("#" + name + "-view").hidden = false;

    const step = STEP_OF_VIEW[name];
    $("#stepper").hidden = !step;
    document.querySelectorAll("#stepper li").forEach((li) => {
        const n = Number(li.dataset.step);
        li.classList.toggle("active", n===step);
        li.classList.toggle("done", n<step); 
    });

    window.scrollTo(0,0);
}

function updateNav() {
    const loggedIn = Boolean(state.user);
    $("#user-nav").hidden = !loggedIn;
    if(loggedIn) $("#user-name").textContent = state.user.name;
}

/* login stuffs */

function login(event) {
    event.preventDefault();
    const username = $("#login-username").value.trim().toLowerCase();
    const password = $("#login-password").value;

    if(!username || !password){
        $("#login-error").textContent = "Please enter your username and password.";
        return;
    }

    const user = USERS.find((u) => u.username === username && u.password === password);
    if(!user){
        $("#login-error").textContent = "Wrong username or password.";
        return;
    }

    $("#login-error").textContent ="";
    $("#login-form").reset();
    startSession(user);
}

function startSession(user){
    state.user = user;
    sessionStorage.setItem(STORAGE_SESSION, user.username);
    updateNav();
    renderFlights();            // ← new
    showView("flights");
}

function logout(){
    state.user= null;
    state.flight= null;
    state.seat= null;
    sessionStorage.removeItem(STORAGE_SESSION);
    updateNav();
    showView("login");
}

/* ===== FLIGHTS ===== */

function setupFilters() {
  const places = [...new Set(FLIGHTS.flatMap((f) => [f.from, f.to]))].sort();
  const options = '<option value="">Any</option>' +
    places.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  $("#filter-from").innerHTML = options;
  $("#filter-to").innerHTML = options;
}

function renderFlights() {
  const from = $("#filter-from").value;
  const to = $("#filter-to").value;
  const list = $("#flight-list");

  const matches = FLIGHTS.filter(
    (f) => (!from || f.from === from) && (!to || f.to === to)
  );

  if (matches.length === 0) {
    list.innerHTML = '<p class="empty">No flights match that search.</p>';
    return;
  }

  list.innerHTML = matches.map((f) => {
    const left = ROWS * COLS.length - takenSeats(f).size;
    const soldOut = left === 0;
    return `
      <article class="flight">
        <div>
          <div class="route">${esc(f.from)} → ${esc(f.to)}</div>
          <div class="meta">${esc(f.number)} · ${esc(f.aircraft)}</div>
          <div class="meta">${formatDate(f.depart)} – ${formatDate(f.arrive)}</div>
        </div>
        <div>
          <div class="price">${money(f.price)}</div>
          <div class="left">${soldOut ? "Sold out" : left + " seats left"}</div>
          <button class="btn primary" data-flight="${f.id}" ${soldOut ? "disabled" : ""}>Select</button>
        </div>
      </article>`;
  }).join("");
}

/* ===== BOOKING: SELECT FLIGHT + PASSENGER ===== */

function flightSummary(f) {
  return `<strong>${esc(f.from)} → ${esc(f.to)}</strong><br>
    ${esc(f.number)} · ${formatDate(f.depart)} · from ${money(f.price)}`;
}

function selectFlight(id) {
  state.flight = FLIGHTS.find((f) => f.id === id);
  state.seat = null;                       // new flight → forget old choices
  state.bag = null;
  $("#passenger-name").value = state.user.name;   // pre-fill
  $("#passenger-error").textContent = "";
  $("#booking-flight").innerHTML = flightSummary(state.flight);
  showView("booking");
}

function submitPassenger(event) {
  event.preventDefault();
  const name = $("#passenger-name").value.trim();
  if (name.length < 2) {
    $("#passenger-error").textContent = "Please enter the passenger's full name.";
    return;
  }
  state.passenger = name;
  console.log("State so far:", state);   // temporary: replaced in Part 6
}

/*start it up*/

function init(){
    setupFilters();
    $("#login-form").addEventListener("submit",login);
    $("#btn-logout").addEventListener("click",logout);

    $("#btn-flights").addEventListener("click", () => { renderFlights(); showView("flights"); });
    $("#filter-from").addEventListener("change", renderFlights);
    $("#filter-to").addEventListener("change", renderFlights);

    const saved = sessionStorage.getItem(STORAGE_SESSION);
    const user = USERS.find((u)=> u.username === saved) ;
    if (user) startSession(user);
    else showView("login");

    // One listener handles every "Select" button (event delegation)
  $("#flight-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-flight]");
    if (btn) selectFlight(btn.dataset.flight);
  });

  $("#passenger-form").addEventListener("submit", submitPassenger);

  // Every button with data-back="viewName" goes back to that view
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.back));
  });
}

init();