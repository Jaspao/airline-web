"use strict";

const USERS = [
    { username: "demo", password: "1234", name:"John Doe"},
    { username: "jason", password: "pass", name:"Jason Seb"},
];

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