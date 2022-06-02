import {Game_Board} from "./xordleboard.js";
import {xordle_colour} from "./xordlecolouring.js"
import {puzzles} from "./wordlists.js"
import {Storage} from "./storage.js"

function get_puzzle(index) {
    let puzzle = puzzles[index];
    let elements = puzzle.split("|");
    return elements.map(function(x) { return x.split(",") });
}

// reset functionality
function new_game() {
    // clear game board and keys
    let gameBoard = document.getElementById("board");
    let keyBoard = document.getElementById("keyboard");
    gameBoard.innerHTML = '';
    keyBoard.innerHTML = '';

    // set random default
    local_storage.random_game_session = local_storage.default("random");
    local_storage.save_data(["random"]);

    let entries = load_game();

    WORDS = entries[0].map(function(x) {return x.toUpperCase()});
    first_words = entries[1].map(function(x) {return x.toUpperCase()});
    
    start_game();
}

function start_game() {
    // hide replay button
    let replay = document.getElementById("replay");
    replay.style.display = "none";

    // show give up button
    let giveup = document.getElementById("giveup");
    giveup.style.display = "inline-block";

    let game = new Game_Board(5, WORDS, local_storage, game_mode);
    game.colouring_method = xordle_colour
    game.end = game_over;
    game.initialize(first_words);
}

function game_over() {
    console.log("game end");
    // show replay button
    let replay = document.getElementById("replay");
    replay.style.display = "inline-block";

    // hide give up button
    let giveup = document.getElementById("giveup");
    giveup.style.display = "none";
}

function load_game() {
    // load game data from local storage
    if (game_mode == "random") {
        local_storage.load_data(["random", "globals"]);
        if (local_storage.random_game_session["game_index"] == null) {
            let index = Math.floor(Math.random()*puzzles.length);
            let entries = get_puzzle(index);

            local_storage.random_game_session["game_index"] = index;
            local_storage.save_data("random");

            return entries;
        } else {
            let index = local_storage.random_game_session["game_index"];
            let entries = get_puzzle(index);

            return entries;
        }
    } else {
        local_storage.load_data(["daily", "globals"]);
        // todo: add a check that the daily puzzle hasn't changed
        if (local_storage.daily_game_session["game_index"] == null) {
            let index = Math.floor(Math.random()*puzzles.length);
            let entries = get_puzzle(index);

            local_storage.daily_game_session["game_index"] = index;
            local_storage.save_data("daily");

            return entries;
        } else {
            let index = local_storage.daily_game_session["game_index"];
            let entries = get_puzzle(index);
            
            return entries;
        }
    }
}

function setup_buttons() {
    // add events to give up and replay buttons
    let replay = document.getElementById("replay");
    replay.addEventListener("click", () => new_game());

    let giveup = document.getElementById("giveup");
    giveup.addEventListener("click", () => game.give_up());
}

let local_storage = new Storage();
let game_mode = "random";
let entries = load_game();

let WORDS = entries[0].map(function(x) {return x.toUpperCase()});
let first_words = entries[1].map(function(x) {return x.toUpperCase()});

setup_buttons();
start_game();