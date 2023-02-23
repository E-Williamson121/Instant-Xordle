// A vanilla js calendar framework

export class Calendar {

    // constructor takes a date "today" passed in, and uses it to build the default calendar automatically.
    constructor(selectedday, startday, endday, game_name, settings, day_setting_function) {
        this.game_name = game_name;
        this.formatOptions = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.locale = "en-US";
        this.months = 
        ["January", 
         "February", 
         "March", 
         "April", 
         "May", 
         "June", 
         "July", 
         "August", 
         "September", 
         "October", 
         "November", 
         "December"];    

        this.today_highlight = true;

        this.settings = settings;
        this.set_day = day_setting_function;

        // selected date is rounded down to the start of the day.
        this.today = new Date(selectedday.getFullYear(), selectedday.getMonth(), selectedday.getDate());

        this.month = selectedday.getMonth();
        this.year = selectedday.getFullYear();

        // date of puzzle starting = minimum date
        this.puzzle_start = startday;

        // date of puzzle ending = the date when the calendar is instantiated (can't go into the future)
        this.puzzle_end = new Date(endday.getFullYear(), endday.getMonth(), endday.getDate());;
        this.max_index = this.calculate_puzzle_day(this.puzzle_end);

        // button for sharing monthly results
        this.share_button = document.getElementById("monthlyshare");
        this.share_button.addEventListener("click", () => this.get_month_results());

        // month tile area
        this.monthdays = document.querySelector(".daytiles");
        this.update_display();

        // add functionality to the left/right arrows.
        let next = document.querySelector(".nextmonth");
        // add functionality to the left/right arrows.
        let prev = document.querySelector(".prevmonth");

        this.update_selected_date(true);

        next.addEventListener("click", () => this.next_month());
        prev.addEventListener("click", () => this.prev_month());
    }

    // utility method for updating the display string for the selected date.
    update_selected_date(full_update) {
        let heading = document.querySelector(".month h4");
        heading.innerHTML = `${this.months[this.month]} ${this.year}`;

        if (full_update) {
            let date_string = document.querySelector(".month p");
            date_string.innerHTML = this.today.toLocaleDateString(this.locale, this.formatOptions);
        }
    }

    // utility method for incrementing the month.
    next_month() {
        this.month = this.month + 1;
        if (this.month > 11) {
            this.year = this.year + 1;
            this.month = 0;
        }
        this.update_display()
    }

    // utility method for decrementing the month
    prev_month() {
        this.month = this.month - 1;
        if (this.month < 0) {
            this.month = 11;
            this.year = this.year - 1;
        }
        this.update_display();
    }

    get_content(day) {
        if ((day < 0) || (day > this.max_index)) {
            // day out of range
            return `</div>`
        }
        
        let solved = this.get_solved(day);
        if (!(solved == null)) {
            if (solved) {
                return `<span class="content">${this.settings.game_symbols["correct"]}</span></div>`
            } else {
                return `<span class="content">⬛</span></div>`
            }
        }
        return `<span class="content">⬜</span></div>`
    }

    get_month_results() {
        let results = `${this.game_name} month results for ${this.months[this.month]} ${this.year}\n`
        let emotes = {undefined:"⬜", null:"⬜", false:"⬛", true:this.settings.game_symbols["correct"]}

        let firstday = new Date(this.year, this.month, 1);
        let start_index = this.calculate_puzzle_day(firstday);

        let lastday = new Date(this.year, this.month+1, 0);
        let month_length = lastday.getDate();

        let num_days = 0
        let num_solved = 0
        let game_times = []

        for (var i = 0; i < month_length; i++) {
            if (!((start_index + i < 0) || (start_index + i > this.max_index))) {
                num_days = num_days + 1;
                results = `${results}${emotes[this.get_solved(start_index + i)]}`
                if (this.get_solved(start_index + i)) {
                    num_solved = num_solved + 1;
                    game_times.push(this.get_time(start_index + i))
                }
            }
        }

        let total_time = game_times.reduce( (acc, x) => (acc + x), 0);
        let average_time = null;
        if (game_times.length > 0) {
            average_time = Math.round(total_time/game_times.length);
        } else {
            average_time = 0;
        }

        results += `\nWin rate for this month: ${Math.round(100*num_solved/num_days)}%`

        if (this.settings.timer_share) {
            results += `\nAverage time per puzzle: ${this.display_time(average_time)}`
            results += `\nTotal time spent solving: ${this.hour_time(total_time)}`
        }

        navigator.clipboard.writeText(results).then(() => alert(`Monthly results copied to clipboard.`));
    }

    // method for setting up the date changing listener on element (id)
    setup_listener(id) {
        let tile = document.getElementById(id);
        tile.addEventListener("click", () => {this.set_day(id)})
    }

    update_day_from_index(index) {
        // length of a day in milliseconds
        let day_length = (1000*60*60*24);

        let new_time = this.puzzle_start.getTime() + (index)*day_length;
        this.today.setTime(new_time);

        // fix any rounding errors that occurred
        let date = this.today;
        this.today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        this.month = date.getMonth();
        this.year = date.getFullYear();

        this.update_display();
    }

    // method for updating the display:
    update_display() {    
        this.update_selected_date(false);
        // first day of the currently selected month
        let firstday = new Date(this.year, this.month, 1);
        let start_index = this.calculate_puzzle_day(firstday);
        let startweekday = firstday.getDay();
    
        // last day of the current month
        let lastday = new Date(this.year, this.month+1, 0);
        let month_length = lastday.getDate();
        let endweekday = lastday.getDay();
    
        // last day of the previous month
        let prevlastday = new Date(this.year, this.month, 0);
        let prevmonth_length = prevlastday.getDate();
        let count = 0;
        
        // array for holding the tiles we wish to push listeners onto
        let listeners = [];

        // get the display for the days at the end of the previous month
        let prevdays = ""
        for (var j = startweekday-1; j >= 0; j--) {
            if ((new Date(this.year, this.month, -j) - this.today) == 0 && this.today_highlight) {
                // the day which is currently selected on the calendar
                prevdays += `<div class="today" id="${start_index - j - 1}"><span class="daynumber">${prevmonth_length - j}</span>`
                listeners.push(`${start_index - j - 1}`);
            } else {
                prevdays += `<div class="prev-date"><span class="daynumber">${prevmonth_length - j}</span>`
            }
            prevdays += this.get_content(start_index - j - 1);
            count += 1
        }

        let month_end = (start_index + month_length) - 1;

        if (month_end > 0 && month_end <= this.max_index) {
            this.share_button.style.visibility = "visible";
        } else {
            this.share_button.style.visibility = "hidden";
        }

        // get the display for the days of the current month
        let days = "";
        for (var i = 0; i < month_length; i++) {
            if ((new Date(this.year, this.month, i+1) - this.today) == 0 && this.today_highlight) {
                // the day which is currently selected on the calendar
                days += `<div class="today" id="${start_index + i}"><span class="daynumber">${i+1}</span>`
                listeners.push(`${start_index + i}`);
                days += this.get_content(start_index + i);
            } else {
                if ((start_index + i < 0) || (start_index + i > this.max_index)) {
                    // being before/after the start/end of the puzzle, prohibited
                    days += `<div class="next-date"><span class="daynumber">${i+1}</span>`
                    days += this.get_content(start_index + i);
                } else {
                    days += `<div id="${start_index + i}"><span class="daynumber">${i+1}</span>`
                    listeners.push(`${start_index + i}`);
                    days += this.get_content(start_index + i);
                }
            }
            count += 1;
        }

        let extrarow = 0;
        if (count < 36) extrarow = 7;
      
         // get the display for the days at the start of the next month
         let nextdays = ""
         for (var j = endweekday; j < 6 + extrarow; j++) {
            if ((new Date(this.year, this.month+1, j-endweekday+1) - this.today) == 0 && this.today_highlight) {
                // the day which is currently selected on the calendar
                nextdays += `<div class="today" id="${start_index + month_length + j - endweekday}"><span class="daynumber">${j-endweekday+1}</span>`
                listeners.push(`${start_index + month_length + j - endweekday}`);
            } else {
                nextdays += `<div class="prev-date"><span class="daynumber">${j-endweekday+1}</span>`
            }
            nextdays += this.get_content(start_index + month_length + j - endweekday);
         }   
    
        this.monthdays.innerHTML = `${prevdays}${days}${nextdays}`;
        for (var i = 0; i < listeners.length; i++) {
            this.setup_listener(`${listeners[i]}`);
        }
    }

    // utility method for determining if a given day's puzzle has been solved
    get_solved(i) {
        let storage = this.settings.storage;
        let quickload = storage.quickload_daily(i)
        if (quickload) return quickload["won_game"]
    }
    
    // utility method for determining a given day's puzzle's time
    get_time(i) {
        let storage = this.settings.storage;
        let quickload = storage.quickload_daily(i)
        return parseFloat(quickload["game_timer"]);
    }

    display_time(t) {
        let s = t % 60;
        let m = Math.floor(t/60);
        return `${this.zero_pad(m)}:${this.zero_pad(s)}`
    }

    hour_time(t) {
        let s = t % 60;
        let m = Math.floor(t/60) % 60;
        let h = Math.floor(t/3600);
        return `${this.zero_pad(h)}:${this.zero_pad(m)}:${this.zero_pad(s)}`
    }

    zero_pad(t) {
        if (t > 9) return `${t}`
        return `0${t}`
    }

    // utility method for calculating what day it is on a target day.
    calculate_puzzle_day(target_day) {
        // day on which the puzzle game started
        let difference = target_day.getTime() - this.puzzle_start.getTime();
    
        // length of a day in milliseconds
        let day_length = (1000*3600*24);
    
        // the dates being subtracted are all full days
        // so the nearest whole number will be the correct one in the event of floating point weirdness.
        return Math.round(difference/day_length);
    }    

}