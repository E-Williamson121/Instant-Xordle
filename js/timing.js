export class SimpleTimer {
    constructor(storage, mode) {
        // set link to storage class, save game mode
        this.storage = storage;
        this.mode = mode;

        // get current time from storage
        if (this.mode == "random") {
            this.time = this.storage.random_game_session["game_timer"];
        } else {
            this.time = this.storage.daily_game_session["game_timer"];
        }

        this.button = document.getElementById("timerbutton");
        this.button.innerText = "timer"

        this.div = document.getElementById("timer");
        this.div.innerText = this.digital_time();
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => this.tick(this), 1000);
    }

    end(clear_display) {
        if (clear_display) {
            this.div.innerText = "––:––";
        } else {
            this.div.innerText = this.digital_time();
        }
    }

    stop() {
        window.clearInterval(this.interval);
        this.button.innerText = "check_circle";
        // remove click events
        let new_button = this.button.cloneNode(true);
        this.button.parentNode.replaceChild(new_button, this.button);
    }

    tick(timer) {
        // don't tick when modals are open
        if (document.body.classList.contains("modal-open")) { 
            return;
        }

        timer.time = timer.time + 1;
        // timer cannot go over 1 hour
        if (timer.time > (60*60 - 1)) {
            timer.time = 60*60 - 1;
        }

        // store timer locally on each tick (means refreshes can allow loading back in at same timer)
        timer.storage.change_session_timer((timer.mode == "random"), timer.time);
        timer.storage.save_data([timer.mode]);

        timer.div.innerText = timer.digital_time();
    }

    get_time(t) {
        let s = t % 60;
        let m = Math.floor(t/60);
        return `${this.zero_pad(m)}:${this.zero_pad(s)}`
    }

    digital_time() {
        let s = this.time % 60;
        let m = Math.floor(this.time/60);
        return `${this.zero_pad(m)}:${this.zero_pad(s)}`
    }

    zero_pad(t) {
        if (t > 9) return `${t}`
        return `0${t}`
    }
}