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

/*start it up*/

function init(){
    $("#login-form").addEventListener("submit",login);
    $("#btn-logout").addEventListener("click",logout);

    const saved = sessionStorage.getItem(STORAGE_SESSION);
    const user = USERS.find((u)=> u.username === saved) ;
    if (user) startSession(user);
    else showView("login");
}

init();