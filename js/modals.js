import {refresh_chart} from "./barchart.js"

class Modal {
    constructor(name) {
        this.modal = document.getElementById(`${name}-modal`);
        this.btn = document.getElementById(name);  
        this.tooltip = document.getElementById(`${name}-tooltip`)

        // default modal behaviour:

        // When the user clicks on the button, open the modal
        this.btn.addEventListener("click", () => this.open_modal()) 

        // tooltip events
        this.btn.addEventListener("mouseenter", () => this.manage_tooltip(true))
        this.btn.addEventListener("mouseleave", () => this.manage_tooltip(false))

        // When the user clicks anywhere outside of the modal, close it
        window.addEventListener("click", (event) => this.close_modal(event))
    }
        
    manage_tooltip(show) {
        // position tooltip below the button and show/hide it
        let buttontop = this.btn.getBoundingClientRect().top + window.scrollY;
        let buttonleft = this.btn.getBoundingClientRect().left + window.scrollX;
        let buttonwidth = this.btn.getBoundingClientRect().right - this.btn.getBoundingClientRect().left 
        let toolwidth = this.tooltip.getBoundingClientRect().right - this.tooltip.getBoundingClientRect().left;

        Object.assign(this.tooltip.style, {
            left: `${buttonleft - toolwidth/2 + buttonwidth/2}px`,
            top: `${buttontop + 30}px`,
            visibility: (show ? "visible" : "hidden"),
            opacity: (show ? 1 : 0),
        });

    }

    open_modal() {
        this.modal.style.display = "block";
        this.tooltip.opacity = 0;
        document.body.classList.add("modal-open");
    };

    close_modal(event) {
        if (event.target == this.modal) {
            this.modal.style.display = "none";
            document.body.classList.remove("modal-open");
        }
    }
}

export class HelpModal extends Modal {
    constructor(name, numpages, local_storage) {
        super(name);

        this.firstread = false;
        this.local_storage = local_storage;
        
        // previous/next buttons
        this.nextpage = document.getElementById("nextpage");
        this.prevpage = document.getElementById("prevpage");

        this.helppage = 0; // current help page number

        this.pages = this.load_pages(numpages);

        this.nextpage.addEventListener("click", () => this.next_page(numpages));
        this.prevpage.addEventListener("click", () => this.prev_page());
    }

    load_pages(numpages) {
        // get help pages
        let pages = [];
        for (var i = 0; i < numpages; i++) {
            let page = document.getElementById(`page${i+1}`)
            page.style.display = "none";
            pages.push(page);
        }
        return pages;
    }

    open_modal() {
        super.open_modal();
        this.helppage = 0;
        this.pages[this.helppage].style.display = "block";

        this.nextpage.textContent = "next>";
        this.prevpage.style.display = "none";
    }

    close_modal(event) {
        // When the user clicks anywhere outside of the modal, close it
         if (event.target == this.modal && !(this.firstread)) {
            this.pages[this.helppage].style.display = "none";
            super.close_modal(event);
        }
    }

    next_page(numpages) {
        if (this.helppage < numpages-1) {
            // hide current page, show next page
            this.pages[this.helppage].style.display = "none";
            this.helppage = this.helppage + 1;
            this.pages[this.helppage].style.display = "block";

            this.prevpage.style.display = "block";
            if (this.helppage == numpages-1) {
                this.nextpage.textContent = "play>";
            }
        } else {
            // special case: last page, next button is replaced by a play button and closes the modal
            this.pages[this.helppage].style.display = "none";
            this.modal.style.display = "none";
            this.firstread = false;
            this.local_storage.settings["help_seen"] = true;
            this.local_storage.save_data(["settings"]);
            document.body.classList.remove("modal-open");
        }
    }

    prev_page() {
        if (this.helppage > 0) {
            this.pages[this.helppage].style.display = "none";
            this.helppage = this.helppage - 1;
            this.pages[this.helppage].style.display = "block";

            this.nextpage.textContent = "next>";
            if (this.helppage == 0) {
                // first page - hide the previous page button
                this.prevpage.style.display = "none";
            }
        }        
    }
}

export class StatsModal extends Modal {
    constructor(name, settings) {
        super(name);
        this.settings = settings;
        this.chart = null;
        this.storage = settings.storage;
    }

    open_modal() {
        super.open_modal();
        // update stats
        let data = this.update_stats(this.storage);
        // remove any previously existing charts
        if (this.chart != null) {
            this.chart.destroy();
        }
        // make a chart based on the new data
        let chart_data = this.storage.global_stats["solve_times"];
        this.chart = refresh_chart(chart_data.map(x => Math.floor(x/60)), this.settings.dark);
    }

    update_stats(storage) {
        let global_stats = Object.values(storage.global_stats);
        let lookups = ["statwins" ,"statplays", "statstreak", "statbeststreak", "statavgtime", "statwinpct"];
    
        let stats = global_stats.slice(0, 4); // number of wins, number of play, streak, best streak

        let total_time = global_stats[4].reduce((acc, x) => (acc + x), 0); // sum of time taken
        let average_time = total_time/global_stats[4].length;              // average time taken
        if (global_stats[4].length > 0) {
            stats.push(storage.timer.get_time(Math.round(average_time)));
        } else {
            stats.push("00:00");
        }

        if (global_stats[0] > 0) {
            stats.push(`${Math.round(100*global_stats[0]/global_stats[1])}%`); // win/loss ratio
        } else {
            stats.push("0%");
        }
    
        for (var i = 0; i < lookups.length; i++){
            let field = document.getElementById(lookups[i]);
            field.innerText = `${stats[i]}`;
        }
    }
}

export class SettingsModal extends Modal {
    constructor(name, storage) {
        super(name);

        this.storage = storage;
        this.in_game = false;

        this.dark = false;
        this.timer_hidden = false;
        this.timer_share = false;

        this.colnames = ["red", "orange", "yellow", "green", "blue", "purple", "pink"]
        this.num_colours = this.colnames.length;
        this.colour_brightnesses = ["light ", "", "dark "]

        // full colour list, formatted as follows:
        //       RED ORANGE YELLOW GREEN BLUE PURPLE PINK
        // LIGHT
        // MID
        // DARK
        this.colours =  [[0, 100, 62], [26, 99, 63], [47, 80, 53], [120, 70, 53], [218, 86, 70], [275, 86, 75], [320, 88, 77],
                         [0, 100, 42], [26, 78, 50], [47, 99, 42], [120, 34, 48], [218, 61, 63], [275, 61, 63], [320, 61, 63],
                         [0, 100, 33], [21, 99, 43], [47, 72, 36], [120, 62, 27], [218, 96, 44], [275, 95, 49], [320, 98, 37]];


        this.colsymbols = {0:"🅱️", 1:"🟧", 2:"🟨", 3:"🟩", 4:"🟦", 5:"🟪", 6:"🌺"}
        this.game_symbols = {"correct" : "", "present" : "", "absent": "⬛"}

        this.timershare = document.getElementById("sharetimer");
        this.timerhide = document.getElementById("hidetimer");
        this.darkmode = document.getElementById("darkmode");

        if (storage.settings["dark_mode"]) {
            this.darkmode.checked = true;
            this.toggle_dark_mode()
        }

        if (storage.settings["hide_timer"]) {
            this.timerhide.checked = true;
            this.timer_hidden = true;
        }

        if (storage.settings["share_timer"]) {
            this.timershare.checked = true;
            this.timer_share = true;
        }

        this.darkmode.addEventListener("change", () => {
            this.toggle_dark_mode()
            this.storage.settings["dark_mode"] = this.dark;
            this.storage.save_data(["settings"]);
        });

        this.timerhide.addEventListener("change", () => {
            this.timer_hidden = !(this.timer_hidden);
            this.storage.settings["hide_timer"] = this.timer_hidden;
            this.toggle_timer();
            this.storage.save_data(["settings"]);    
        });

        this.timershare.addEventListener("change", () => {
            this.timer_share = !(this.timer_share);
            this.storage.settings["share_timer"] = this.timer_share;
            this.storage.save_data(["settings"]);    
        });

        this.selected = [null, null, null];
        this.boxes = [[],[],[]];
        this.blocked = [[],[],[]];

        this.setup_colour_menus(["correctselect", "presentselect", "inactiveselect"]);
    }

    toggle_timer() {
        let timer = document.getElementById("timerstuff");
        if (this.in_game && this.timer_hidden) { 
            // if in game and hide timer setting, then hide the timer
            timer.style.opacity=0;
            //timer.style.visibility = "hidden";
        } else {
            // otherwise, show timer
            timer.style.opacity=1;
            //timer.style.visibility = "visible";
        }
    }

    toggle_dark_mode() {
        if (this.dark) {
            this.dark = false;
            document.body.classList.remove("darkmode");
            return;
        }
        this.dark = true;
        document.body.classList.add("darkmode");
    }

    setup_colour_menus(menu_ids) {
        let menus = []
        for (let m = 0; m < menu_ids.length; m++) {
            let menu_id = menu_ids[m];
            menus.push(document.getElementById(menu_id));
        }

        for (let m = 0; m < menus.length; m++) {
            let menu = menus[m];
            let m_name = `${menu_ids[m]}col`
            for (let i = 0; i < this.colours.length; i++) {
                let box = document.createElement("div");
                box.classList.add("box");
                box.style.setProperty('--box-color', this.colours[i][0]);
                box.style.setProperty("--box-shadeval", `${this.colours[i][1]}%`);
                box.style.setProperty("--box-lightval", `${this.colours[i][2]}%`);
                menu.appendChild(box);
                if (i == this.storage.settings[m_name]) {
                    this.selected[m] = box;
                    box.classList.add("selected");
                }

                this.boxes[m].push(box);

                let blocked = false;
                for (var n = 0; n < menus.length; n++) {
                    let n_name = `${menu_ids[n]}col`
                    let local_value = this.storage.settings[n_name]
                    if (n != m) {
                        if (local_value % this.num_colours == i % this.num_colours) {
                            blocked = true;
                            box.classList.add("blocked");
                        }
                    }
                }
                this.blocked[m].push(blocked);

                box.addEventListener("click", () => {
                    if (this.blocked[m][i]) return;

                    this.selected[m].classList.remove("selected");

                    // handle box blocking
                    let local_value = this.storage.settings[m_name]
                    for (var n = 0; n < menus.length; n++){
                        if (n != m) {
                            for (var j = 0; j < this.num_colours*menus.length; j++) {
                                if (j % this.num_colours == local_value % this.num_colours) {
                                    this.boxes[n][j].classList.remove("blocked")
                                    this.blocked[n][j] = false;    
                                } else if (j % this.num_colours == i % this.num_colours) {
                                    this.boxes[n][j].classList.add("blocked")
                                    this.blocked[n][j] = true; 
                                }   
                            }
                        }
                    }

                    this.set_colour(m, m_name, i, this.colours[i])
                    box.classList.add("selected");
                    this.selected[m] = box;
                })

                box.addEventListener("mouseenter", () => {
                    if (this.blocked[m][i]) return;

                    this.preview_colour(m, this.colours[i])
                })

                box.addEventListener("mouseleave", () => {
                    if (this.blocked[m][i]) return;

                    let local_value = this.storage.settings[m_name];
                    this.set_colour(m, m_name, local_value, this.colours[local_value]);
                })
            }   

            // initialize variables to actually hold local stored values
            let local_value = this.storage.settings[m_name];
            this.set_colour(m, m_name, local_value, this.colours[local_value]);
        }
    }

    preview_colour(col_num, hsl) {
        let properties = [`--correctcol`, `--presentcol`, `--inactivecol`];
        let root = document.documentElement;
        root.style.setProperty(properties[col_num], `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`);       
    }

    set_colour(col_type, m_name, col_num, hsl) {
        let properties = [`--correctcol`, `--presentcol`, `--inactivecol`];
        let root = document.documentElement;
        root.style.setProperty(properties[col_type], `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`);

        // update local storage to reflect change made
        this.storage.settings[m_name] = col_num;
        this.storage.save_data(["settings"]);

        // update game symbol
        let category = m_name.slice(-m_name.length, -9); // remove the last characters ('selecthue') from m_name to get category
        if (!(category == "inactive")) this.game_symbols[category] = this.colsymbols[col_num % this.num_colours];
        
        // update colour names in instructions
        let colour_spans = document.getElementsByClassName(`${category}_colourname`);
        let colourname = `${this.colour_brightnesses[Math.floor(col_num / this.num_colours)]}${this.colnames[col_num % this.num_colours]}`
        for (let i = 0; i < colour_spans.length; i++) {
            colour_spans[i].innerText = colourname;
        }
    }
}

export class CalendarModal extends Modal {
    constructor(name, calendar, storage) {
        super(name);
        this.calendar = calendar;
        this.storage = storage
    }

    open_modal() {
        super.open_modal();
        this.calendar.update_display();
    }
}