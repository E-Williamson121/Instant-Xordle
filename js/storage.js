export class Storage {
    constructor() {
        // set default values
        this.global_stats = this.default("globals");
        this.game_index = 0;
        this.daily_game_session = this.default("daily");
        this.random_game_session = this.default("random");
        this.settings = this.default("settings");
        this.timer = null;
    }

    // utility function setting default object values
    default(item) {
        if (item == "globals") {
            return {
                "games_won" : 0,
                "games_played" : 0,
                "current_streak" : 0,
                "max_streak" : 0,
                "solve_times" : []
            }
        }

        if (item == "daily") { 
            return {
                "game_timer" : 0, // integer value of seconds
                "won_game" : null, // boolean detailing if the game was won or given up
                "game_guess" : null // ["AAAAA", "BBBBB"] or null
            }
        }

        if (item == "random") {
            return {
                "game_timer" : 0, // integer value of seconds
                "game_index" : null, // integer value for lookup of puzzle
                "won_game" : null, // boolean detailing if the game was won or given up
                "game_guess" : null // ["AAAAA", "BBBBB"] or null
            }
        }

        if (item == "settings") {
            return {
                "dark_mode" : false,
                "hide_timer" : false,
                "share_timer" : true,
                "help_seen" : false,
                "correctselectcol" : 10,
                "presentselectcol" : 9,
                "inactiveselectcol" : 11, 
            }
        }
    }

    update_globals(won, time) {
        this.global_stats["games_played"] = this.global_stats["games_played"] + 1;

        if (won) {
            // won game, so increment number of games won and streak count
            this.global_stats["games_won"]  = this.global_stats["games_won"] + 1;
            this.global_stats["current_streak"] = this.global_stats["current_streak"] + 1;

            // update solve times array and average time
            this.global_stats["solve_times"].push(time);
            let total_time = this.global_stats["solve_times"].reduce( (acc, x) => (acc + x), 0);
            let num_games = this.global_stats["solve_times"].length;
            if (num_games == 0) {
                this.global_stats["average_solve_time"] = 0;
            } else {
                this.global_stats["average_solve_time"] = total_time/num_games;
            }
        } else {
            // lost, so reset the streak count
            this.global_stats["current_streak"] = 0;
        }
        
        if (this.global_stats["current_streak"] > this.global_stats["max_streak"]) {
            // maximum streak
            this.global_stats["max_streak"] = this.global_stats["current_streak"];
        }
    }

    // utility method for updating session timers
    change_session_timer(random, newtime) {
        if (random) {
            this.random_game_session["game_timer"] = newtime; 
        } else {
            this.daily_game_session["game_timer"] = newtime;
        }
    }

    quickload_daily(index) {
        let daily_data = window.localStorage.getItem(`daily_${index}`);
        if (daily_data) return JSON.parse(daily_data);
    }

    // method for saving stats to local storage
    save_data(to_save) {
        if (to_save.includes("globals")) {
            window.localStorage.setItem("globals", JSON.stringify(this.global_stats));
        }
        if (to_save.includes("daily")) {
            window.localStorage.setItem(`daily_${this.game_index}`, JSON.stringify(this.daily_game_session));
        }
        if (to_save.includes("random")) {
            window.localStorage.setItem("random", JSON.stringify(this.random_game_session));
        }
        if (to_save.includes("settings")) {
            window.localStorage.setItem("settings", JSON.stringify(this.settings));
        }
    }

    // method for loading stats from local storage (if no data is found for one of these, set the default value)
    load_data(to_load) {
        if (to_load.includes("globals")) {
            let global_data = window.localStorage.getItem("globals");
            if (global_data) {
                this.global_stats = JSON.parse(global_data);
            } else {
                this.global_stats = this.default("globals");
            }
        }
        if (to_load.includes("daily")) {
            let daily_data = window.localStorage.getItem(`daily_${this.game_index}`);
            if (daily_data) {
                this.daily_game_session = JSON.parse(daily_data);
            } else {
                this.daily_game_session = this.default("daily");
            }
        }
        if (to_load.includes("random")) {
            let random_data = window.localStorage.getItem("random");
            if (random_data) {
                this.random_game_session = JSON.parse(random_data);
            } else {
                this.random_game_session = this.default("random");
            }
        }
        if (to_load.includes("settings")) {
            let settings_data = window.localStorage.getItem("settings");
            if (settings_data) {
                this.settings = JSON.parse(settings_data);
            } else {
                this.settings = this.default("settings");
            }
        }
    }
}