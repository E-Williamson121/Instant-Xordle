import {KeyBoard} from "./keyboard.js";
import {SimpleTimer} from "./timing.js";
import {Validate} from "./validation.js";

// class that handles all functionality relating to the main game board
export class Game_Board{
    constructor(board_width, game_words, game_storage, game_mode, settings) {
        this.game_mode = game_mode;
        this.game_storage = game_storage;
        this.stats_lock = false;

        this.settings = settings;

        this.width = board_width;
        this.height = 5;
        this.words = game_words;
        this.found = 0;

        this.current_letter = 0;
        this.current_guess = 0;
        this.colouring_method = null;

        this.prev_guesses = [];
        this.prev_colourings = [];

        this.game_board = document.getElementById("board");
        this.keyboard = document.getElementById("keyboard");

        this.status = document.getElementById("status");
        this.status.innerText = `There are two words remaining.`;
        this.status.classList.add("noselect"); // no selecting the status message

        this.game_over = false;
        this.gaveup = false;
    }

    initialize(first_words) {
        this.height = first_words.length + 2;
        this.generate_board();
        
        this.keyboard = new KeyBoard(this, this.keyboard);

        this.timer = new SimpleTimer(this.game_storage, this.game_mode);
        this.game_storage.timer = this.timer;

        this.setup_controls();

        // prevent scrolling with up/down arrows
        window.addEventListener("keydown", (e) => {
            if (e.code == "ArrowDown" || e.code == "ArrowUp") {
                e.preventDefault(); 
            }
        })

        this.auto_fill(first_words);

        // A guess was previously entered, so auto-submit it.
        let storage = this.get_board_storage();
        if (storage["game_guess"]) {
            this.stats_lock = true;
            this.give_up();
            if (storage["won_game"]) {
                this.status.innerText = `You won! The words were ${this.words[0]} and ${this.words[1]}.`;
            }
            return;
        } 

        this.timer.start();
    }

    get_board_storage() {
        if (this.game_mode == "random") return this.game_storage.random_game_session;
        return this.game_storage.daily_game_session;
    }

    generate_board() {
        // board is shorter than expected - pad the height with blanks
        if (this.height < 6) {
            for (var y = 0; y < (6 - this.height); y++) {
                // empty row       
                let empty = document.createElement("span");
                empty.id = `empty${y}`;
                empty.classList.add("emptyrow");
                empty.classList.add("noselect"); // no selecting a "huh?"
                empty.innerText = "";
                this.game_board.appendChild(empty);
            }  
        }

        // make individual board tiles, set ids and blank inner text.
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                let tile = document.createElement("span");
                tile.id = `${x}-${y}`;
                tile.classList.add("tile");
                if (y == this.height-2) {
                    // current row of entry has active class
                    tile.classList.add("active")
                    tile.addEventListener("click", () => {
                        this.activate_row(this.height-2);
                        this.deactivate_row(this.height-1);
                    })
                }
                if (y == this.height-1) {
                    // other row of entry has inactive class
                    tile.classList.add("inactive")
                    tile.addEventListener("click", () => {
                        this.activate_row(this.height-1);
                        this.deactivate_row(this.height-2);
                    })

                }
                tile.classList.add("noselect"); // no selecting the letters in tiles
                tile.innerText = "";
                this.game_board.appendChild(tile);
            }     

            // the column of "huh?" at the right-hand side of the board       
            let denotator = document.createElement("span");
            denotator.id = `huh${y}`;
            denotator.classList.add("huhtile");
            denotator.classList.add("noselect"); // no selecting a "huh?"
            denotator.innerText = "";
            this.game_board.appendChild(denotator);
        }
    }    

    // A utility method for getting the tile at (x, y)
    get_tile(x, y){
        return document.getElementById(`${x}-${y}`);
    }

    setup_controls() {
        document.addEventListener("keyup", (e) => {
            this.process_key(e.code);
        })
    }

    auto_fill(words) {
        for (var i = 0; i < words.length; i++){
            let word = words[i];
            for (var j = 0; j < word.length; j++){
                let letter = word[j];
                this.enter_letter(letter);
            }
            this.submit_word();
        }
    }

    default_status_message(msg) {
        if (msg) {
            this.status.innerText = `There are two words remaining (${msg}).`;
        } else {
            this.status.innerText = `There are two words remaining.`;
        }
    }

    process_key(key) {
        // no keyboard UI after game has ended!
        if (this.game_over) return;

        if (key == "Enter") {
            // submit word (can alter status message, so returns early)
            this.submit_pair();
            return;
        }

        if ((("KeyA" <= key && key <= "KeyZ") || (["Backspace", "ArrowDown", "ArrowUp"].includes(key)))) {
            // normal inputs reset the status message
            this.default_status_message();
        }

        // alphabetical keys
        if ("KeyA" <= key && key <= "KeyZ") {
            this.enter_letter(key[3]);

        // backspace key
        } else if (key == "Backspace") {
            this.delete_letter();
        
        } else if (key == "ArrowDown") {
            this.activate_row(this.height-1);
            this.deactivate_row(this.height-2);
        
        } else if (key == "ArrowUp") {
            this.activate_row(this.height-2);
            this.deactivate_row(this.height-1);
        }
    }

    enter_letter(letter) {
        // no entering once we've filled up all the slots
        if (this.current_letter == this.width) {
            this.default_status_message("You can use up/down arrow keys or click light gray tiles to change word");
            return;
        }

        // enter letter
        let tile = this.get_tile(this.current_letter, this.current_guess);
        tile.textContent = letter;
        this.current_letter = this.current_letter + 1;
    }

    delete_letter(){
        // no deleting if there's nothing to delete
        if (this.current_letter == 0) return;
    
        // delete last entered letter
        let tile = this.get_tile(this.current_letter-1, this.current_guess);
        tile.textContent = "";
        this.current_letter = this.current_letter - 1;
    }

    // method to activate the nth row of tiles
    activate_row(number) {
        this.current_letter = 0;
        this.current_guess = number;
        let keyboard = this.keyboard.keys

        for (var x = 0; x < this.width; x++) {
            let tile = this.get_tile(x, number);

            // set activity flags
            tile.classList.remove("inactive");
            tile.classList.add("active");

            // find the last position in the word that was entered.
            if (tile.innerText != "") {
                this.current_letter = this.current_letter + 1;
                keyboard[tile.innerText].tile.classList.remove("activekey");
            }

        }
    }

    // method to deactivate the nth row of tiles
    deactivate_row(number) {
        let keyboard = this.keyboard.keys
        for (var x = 0; x < this.width; x++) {
            let tile = this.get_tile(x, number);

            // set activity flags
            tile.classList.remove("active");
            tile.classList.add("inactive");

            // find the last position in the word that was entered.
            if (tile.innerText != "") {
                keyboard[tile.innerText].tile.classList.add("activekey");
            }    
        }
    }

    // method to submit both words in the xordle pair
    submit_pair() {
        let word1 = this.get_guess(this.height-2);
        let word2 = this.get_guess(this.height-1);
        let validity = Validate(word1, word2, this.prev_guesses, this.prev_colourings);
        if (validity != "valid") {
            this.default_status_message(validity);
            return;
        }

        // game won
        this.keyboard.clear_actives() // remove guess highlighting

        // update local storage with the win
        let storage = this.get_board_storage()
        storage["game_guess"] = [word1, word2];
        if (storage["won_game"] == null) storage["won_game"] = true;
        if (!(this.stats_lock) && this.game_mode == "daily") {
            this.game_storage.update_globals(true, this.timer.time);
        }
        this.game_storage.save_data(["globals", this.game_mode]);

        this.current_guess = this.height-2;
        this.submit_word();
        this.submit_word();

        // stop the timer
        this.timer.stop();
        this.end();
    }

    // method for automatically giving up a game
    give_up() {
        this.keyboard.clear_actives() // remove guess highlighting
        this.current_guess = this.height-2;
        this.gaveup = true;

        // update local storage with the loss
        let storage = this.get_board_storage()
        storage["game_guess"] = this.words;
        if (storage["won_game"] == null) storage["won_game"] = false;
        if (!(this.stats_lock) && this.game_mode == "daily") {
            this.game_storage.update_globals(false, this.timer.time);
        }
        this.game_storage.save_data(["globals", this.game_mode]);

        // for each word in the solution
        for (var i = 0; i < this.words.length; i++) {
            let word = this.words[i];
            // make sure the guess is blank
            this.current_letter = this.width;
            for (var j = 0; j < this.width; j++) {
                this.delete_letter();
            }
            // automatically submit the word
            for (var j = 0; j < word.length; j++){
                let letter = word[j];
                this.enter_letter(letter);
            }
            this.submit_word();
        }

        // stop the timer
        this.timer.stop();
        this.end();
    }

    submit_word() {
        // figure out what the user's guess was
        let guessed_word = this.get_guess(this.current_guess);
        this.prev_guesses.push(guessed_word);
    
        // get colourings for the guess, colour the tiles appropriately.
        let colouring = this.colouring_method(guessed_word, this.words);
        this.prev_colourings.push(colouring);

        if (colouring.reduce(function(x, y) {return (x + y);}, 0) == 10 && (!(this.words.includes(guessed_word)))) {
            // found a "huh?" (letters all in the right spots but not the answer)
            document.getElementById(`huh${this.current_guess}`).innerText = "huh?";
        }
        this.colour_tiles(colouring, this.current_guess);
    
        // correct guess to win
        if (this.words.includes(guessed_word)) {
            if (this.found == 0) {
                this.found = 1
                this.status.innerText = `Found ${guessed_word}. There is one word remaining.`;
            } else {
                if (this.gaveup) {
                    this.status.innerText = `You gave up. The words were ${this.words[0]} and ${this.words[1]}.`;
                } else {
                    this.status.innerText = `You won! The words were ${this.words[0]} and ${this.words[1]}.`;
                }
                this.game_over = true;
                return;
            }
        }
    
        this.current_letter = 0;
        this.current_guess = this.current_guess + 1;
    
        // out of guesses
        if (this.current_guess == this.height) {
            this.status.innerText = `This message should never appear. If it does, please contact the creator.`;
            this.game_over = true;
            return;
        }
    }

    get_guess(number) {
        // obtains the nth guess the user entered.
        let guess_word = "";
        for (var x = 0; x < this.width; x++) {
            let tile = this.get_tile(x, number);
            guess_word = guess_word + tile.innerText;
        }
        return guess_word;
    }

    colour_tiles(colours, number) {
        // shorthand list of tile types
        let tile_types = ["absent", "present", "correct"];

        // references to keyboard stuff
        let keyboard = this.keyboard.keys;
        let counters = this.keyboard.counters;

        // visually colour the tiles in the nth guess
        for (var x = 0; x < this.width; x++) {
            let colour = tile_types[colours[x]]

            let tile = this.get_tile(x, number);
            tile.classList.add(colour);

            keyboard[tile.innerText].update_status(colour, counters);
        }
    }

    generate_share_message(timer_hidden){
        let head = "";
        let tail = "";
        let puzzle_header = document.getElementById("header");
        let time = document.getElementById("timer");
        if (this.get_board_storage()["won_game"]) {
            // game won
            let time_taken = time.textContent;
            if (timer_hidden) time_taken = "";
            head = `${puzzle_header.textContent}: ${this.height}/${this.height}, ${time_taken}\n`; // daily xordle #xxx: ☑
            tail = `${this.settings.game_symbols["correct"].repeat(5)}\n${this.settings.game_symbols["correct"].repeat(5)}`;
        } else {
            // game lost
            head = `${puzzle_header.textContent}: X/${this.height}\n`; // daily xordle #xxx:
            tail = `${this.settings.game_symbols["absent"].repeat(5)}\n${this.settings.game_symbols["absent"].repeat(5)}`;
        }
    
        let board = "";
        // get board colours
        for (var y = 0; y < this.height-2; y++) {
            for (var x = 0; x < this.width; x++) {
                let tile = document.getElementById(`${x}-${y}`);
                if (tile.classList.contains("correct")) {
                    board = `${board}${this.settings.game_symbols["correct"]}`;
                } else if (tile.classList.contains("present")) {
                    board = `${board}${this.settings.game_symbols["present"]}`;
                } else {
                    board = `${board}${this.settings.game_symbols["absent"]}`;
                }
            }
            board = `${board}\n`;
        }
    
        let message = `${head}${board}${tail}\nPlay at ${window.location.href}`
        navigator.clipboard.writeText(message).then(() => alert(`Game result copied to clipboard.`));
    }
}