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

        this.paused = false;

        this.button = document.getElementById("timerbutton");
        this.button.innerText = "pause"
        this.button.addEventListener("click", () => this.toggle_pause());

        this.div = document.getElementById("timer");
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => this.tick(this), 1000);
    }

    unpause() {
        this.paused = false;
        this.button.innerText = "pause"
    }

    toggle_pause() {
        this.paused = !(this.paused);
        if (this.paused) {
            this.button.innerText = "play_arrow"
        } else {
            this.button.innerText = "pause"
        }
    }

    stop() {
        window.clearInterval(this.interval);
        this.button.innerText = "check_circle"
        // remove click events
        let new_button = this.button.cloneNode(true);
        this.button.parentNode.replaceChild(new_button, this.button);
    }

    tick(timer) {
        if (timer.paused) return;

        timer.time = timer.time + 1;
        // timer cannot go over 1 hour
        if (timer.time > (60*60 - 1)) {
            timer.time = 60*60 - 1;
        }

        // store timer locally (avoids problems in the future)
        timer.storage.change_session_timer((timer.mode == "random"), timer.time);
        timer.storage.save_data([timer.mode]);

        timer.div.innerText = timer.digital_time();
    }

    letter_time() {
        let s = this.time % 60;
        let m = Math.floor(this.time/60);
        if (m == 0) return `${s}s`
        return `${m}m ${s}s`
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