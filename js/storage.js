export class Storage {
    constructor() {
        // set default values
        this.global_stats = this.default("globals");
        this.daily_game_session = this.default("daily");
        this.random_game_session = this.default("random");
    }

    // utility function setting default object values
    default(item) {
        if (item == "globals") {
            return {
                "games_won" : 0,
                "games_played" : 0,
                "current_streak" : 0,
                "max_streak" : 0,
                "average_solve_time" : 0
            }
        }

        if (item == "daily") { 
            return {
                "game_timer" : 0, // integer value of seconds
                "game_index" : null, // integer value for lookup of puzzle
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
    }

    update_globals(won, time) {
        this.global_stats["games_played"] = this.global_stats["games_played"] + 1;

        if (won) {
            // won game, so increment number of games won and streak count
            this.global_stats["games_won"]  = this.global_stats["games_won"] + 1;
            this.global_stats["current_streak"] = this.global_stats["current_streak"] + 1;

            // update the average solve time: average(n+1) = (n*average(n) + time)/(n + 1)
            let n = this.global_stats["games_played"];
            this.global_stats["average_solve_time"] = (n*(this.global_stats["average_solve_time"]) + time)/(n + 1);
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

    // method for saving stats to local storage
    save_data(to_save) {
        if (to_save.includes("globals")) {
            window.localStorage.setItem("globals", JSON.stringify(this.global_stats));
        }
        if (to_save.includes("daily")) {
            window.localStorage.setItem("daily", JSON.stringify(this.daily_game_session));
        }
        if (to_save.includes("random")) {
            window.localStorage.setItem("random", JSON.stringify(this.random_game_session));
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
            let daily_data = window.localStorage.getItem("daily");
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
    }
}