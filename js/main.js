import {Game_Board} from "./xordleboard.js";
import {xordle_colour} from "./xordlecolouring.js"
import {random_puzzles, daily_puzzles, rand_strings} from "./wordlists.js"
import {Storage} from "./storage.js"
import {Calendar} from "./calendar.js"
import {CalendarModal, StatsModal, HelpModal, SettingsModal} from "./modals.js"

function get_puzzle(game_mode, index) {
    let puzzle = null;
    if (game_mode == "daily") {
        puzzle = daily_puzzles[index % daily_puzzles.length];
    } else {
        puzzle = random_puzzles[index % random_puzzles.length];
    }
    let elements = puzzle.split("|");
    return elements.map(function(x) { return x.split(",") });
}

function start_game() {
    // hide share button
    let share = document.getElementById("share");
    share.style.display = "none";

    // show give up button
    let giveup = document.getElementById("giveup");
    giveup.style.display = "inline-block";

    xordle_settings.in_game = true;
    xordle_settings.toggle_timer();

    body.style.visibility = "visible";

    game = new Game_Board(5, WORDS, local_storage, game_mode, xordle_settings);
    game.colouring_method = xordle_colour
    game.end = game_over;
    game.initialize(first_words);
}

function game_over() {
    if (game_mode == "random") {
        game.timer.end(!(local_storage.random_game_session["won_game"]))
    } else {
        game.timer.end(!(local_storage.daily_game_session["won_game"]))
    }

    // manage timer show/hide setting
    xordle_settings.in_game = false;
    xordle_settings.toggle_timer();

    // show share button
    let share = document.getElementById("share");
    share.style.display = "inline-block";

    // hide give up button
    let giveup = document.getElementById("giveup");
    giveup.style.display = "none";
}

function load_game() {
    let entries = get_puzzle(game_mode, puzzle_index);
    let puzzle_header = document.getElementById("header");

    local_storage.game_index = puzzle_index
    local_storage.load_data([game_mode, "globals"])

    if (game_mode == "daily") {
        puzzle_header.innerText = `Daily Instant Xordle #${puzzle_index+1}`
        return entries;
    } else {
        // random puzzles have no displayed number to give the impression that there are infinitely many.
        puzzle_header.innerText = `Random Instant Xordle`

        // if same as previous random game, return to that game
        if (local_storage.random_game_session["game_index"] == puzzle_index) return entries;

        // new random game, clear storage
        local_storage.random_game_session = local_storage.default("random")
        local_storage.random_game_session["game_index"] = puzzle_index
        local_storage.save_data("random")

        return entries;
    }
}

function setup_buttons() {
    let giveup = document.getElementById("giveup");
    giveup.addEventListener("click", () => game.give_up());
}

let sharebutton = document.getElementById("share");
sharebutton.style.cursor = "pointer";
sharebutton.addEventListener("click", () => game.generate_share_message(!xordle_settings.timer_share))

let game_start_date = "02/19/2023";
let puzzle_index = -1;
let game_mode = "undefined";

let local_storage = new Storage();
local_storage.load_data(["settings"]);

async function get_global_date() {
    const response = await fetch("https://worldtimeapi.org/api/ip")
    let data = await response.json()
    return data.datetime;
}

// get date from an api to prevent people time travelling using system settings (lol)
let current_date = await get_global_date();

// set up modals
let xordle_help = new HelpModal("help", 7, local_storage);
let xordle_settings = new SettingsModal("settings", local_storage);
let xordle_stats = new StatsModal("stats", xordle_settings);
// make calendar (dates are: currently selected date (from query params), variant start date, variant end date (= today's date))
let calendar = new Calendar(new Date(current_date), new Date(game_start_date), new Date(current_date), "Instant Xordle", xordle_settings, set_day);
let xordle_calendar = new CalendarModal("calendar", calendar, local_storage);

// utility function to remove query parameters
function remove_params() {
    window.location.href = window.location.href.slice(-window.location.href.length, -window.location.search.length)
}

// utility function to check integer query parameter against a range
function check_integer_parameter(param, max_val) {
    let paramval = parseFloat(param)

    if (paramval.toString() != param) remove_params()        // if not entirely numeric, remove parameters
    if (!(paramval == Math.floor(paramval))) remove_params() // if non-integer, remove parameters
    if (paramval < 0 || paramval > max_val) remove_params()  // if outside of appropriate range, remove parameters

    return true;
}

function set_day(index) {
    let without_params = window.location.href.slice(-window.location.href.length, -window.location.search.length)
    window.location.href = `${without_params}?d=${index}`
}

function load_random_game() {
    local_storage.load_data(["random"]);
    let prev_index = local_storage.random_game_session["game_index"]
    let index = prev_index;
    while (index == prev_index) {
        index = Math.floor(Math.random()*(num_randoms))
    }
    let without_params = window.location.href.slice(-window.location.href.length, -window.location.search.length)
    window.location.href = `${without_params}?r=${rand_strings[index]}`
}

// query parameter handling
let params = new URLSearchParams(window.location.search);
let current_day = calendar.max_index;    // index of today's puzzle
let num_randoms = random_puzzles.length; // number of random puzzles in dataset
let daily_param = params.get("d")
let random_param = params.get("r")

// both daily and random => remove parameters
if (daily_param != null && random_param != null) {
    remove_params()
} else {
    if (daily_param != null) {
        if (check_integer_parameter(daily_param, current_day)) {
            calendar.update_day_from_index(parseFloat(daily_param))
            puzzle_index = parseFloat(daily_param); // set to daily puzzle via parameter
            game_mode = "daily";
        }
    } else if (random_param != null) {
        // random puzzle query params are randomized strings of characters. 
        // this ensures that puzzles can only be shared after they have been first played, and not the other way around.
        // invalid string => remove
        if (!rand_strings.includes(random_param)) remove_params();

        calendar.today_highlight = false;
        puzzle_index = rand_strings.indexOf(random_param); // puzzle index is the index of the randomized url string
        game_mode = "random";
    } else {
        // no parameters -> go to current daily
        set_day(current_day);
    }
}

setup_buttons();

function manage_random_tooltip(show) {
    // position tooltip below the button and show/hide it
    let buttontop = random_btn.getBoundingClientRect().top + window.scrollY;
    let buttonleft = random_btn.getBoundingClientRect().left + window.scrollX;
    let buttonwidth = random_btn.getBoundingClientRect().right - random_btn.getBoundingClientRect().left 
    let toolwidth = random_tooltip.getBoundingClientRect().right - random_tooltip.getBoundingClientRect().left;

    Object.assign(random_tooltip.style, {
        left: `${buttonleft - toolwidth/2 + buttonwidth/2}px`,
        top: `${buttontop + 30}px`,
        visibility: (show ? "visible" : "hidden"),
        opacity: (show ? 1 : 0),
    });
}

// random game launcher
let random_btn = document.getElementById("random");  
let random_tooltip = document.getElementById("random-tooltip")

// When the user clicks on the button, open the modal
random_btn.addEventListener("click", () => load_random_game()) 

// tooltip events
random_btn.addEventListener("mouseenter", () => manage_random_tooltip(true))
random_btn.addEventListener("mouseleave", () => manage_random_tooltip(false))

if (!(local_storage.settings["help_seen"])) {
    xordle_help.open_modal();
    xordle_help.firstread = true;
}

let entries = load_game();
let game = null;

let WORDS = entries[0].map(function(x) {return x.toUpperCase()});
let first_words = entries[1].map(function(x) {return x.toUpperCase()});

start_game();