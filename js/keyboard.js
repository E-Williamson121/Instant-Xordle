export class KeyBoard {
    constructor (game, keyboard_frame) {
        this.game = game;
        this.keyboard_frame = keyboard_frame;
        let keyboard_raw = [
            ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
            ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
            ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫" ]
        ];
        let res = this.create_keyboard(keyboard_raw);
        this.keys = res[0];
        this.counters = res[1];
    }

    create_keyboard(keyboard_content) {
        // keyboard and row which will be returned
        let keyboard = {};
        let counters = {};

        for (var i = 0; i < keyboard_content.length; i++) {
            let current_row = keyboard_content[i];
            let keyboardrow = document.createElement("div");
            keyboardrow.classList.add("keyboard-row");

            if (i == 1){
                // spacer for middle row
                let space = document.createElement("div");
                space.classList.add("spacer");
                keyboardrow.appendChild(space);
            }

            for (var j = 0; j < current_row.length; j++){
                let button = new keyboard_button(this.game, current_row[j]);
                button.setup(keyboardrow);
                keyboard[current_row[j]] = button;
            }
            this.keyboard_frame.appendChild(keyboardrow);
        }

        // extra row for counters
        let counter_types = ["correct", "present", "absent"];

        let keyboardrow = document.createElement("div");
        keyboardrow.classList.add("keyboard-row");

        for (var k = 0; k < counter_types.length; k++) {
            let counter = new keyboard_counter(this.game, counter_types[k]);
            counter.setup(keyboardrow);
            counters[counter_types[k]] = counter;
        }

        this.keyboard_frame.appendChild(keyboardrow);

        return [keyboard, counters];
    }

    clear_actives() {
        let allkeys = Object.keys(this.keys);
        for (var i = 0; i < allkeys.length; i++) {
            this.keys[allkeys[i]].tile.classList.remove("activekey");
        }
    }
}

class keyboard_button {
    constructor (game, content) {
        this.game = game;
        this.content = content;

        if (content == "Enter") {
            this.id = content;
        } else if (content == "⌫") {
            this.id = "Backspace";
        } else {
            this.id = `Key${content}` // map letter ids e.g. A -> KeyA
        }

        this.status = null;
        this.tile = null;
    }

    setup (row) {
        let keytile = document.createElement("div");

        this.tile = keytile;
        keytile.classList.add("noselect"); // no selecting the letters on the keyboard
        keytile.id = this.id;

        if (this.content == "Enter") {
            keytile.classList.add("wide-key-tile");
        } else {
            keytile.classList.add("key-tile");
        }

        // add events for keyboard entry
        keytile.addEventListener("click", () => {
            this.game.process_key(this.id);
        })

        keytile.innerText = this.content;
        row.appendChild(keytile);
    }

    update_status(proposed_status, counters) {
        let status_hierarchy = {"correct" : 3, "present" : 2, "absent" : 1, null : 0};
        if (status_hierarchy[proposed_status] > status_hierarchy[this.status]) {

            if (this.status != null) {
                counters[this.status].update_count(-1);
                this.tile.classList.remove(this.status);
            }

            this.tile.classList.add(proposed_status);
            this.status = proposed_status;
            counters[this.status].update_count(1);
        }
    }
}

class keyboard_counter {
    constructor (game, type) {
        this.game = game;
        this.type = type;
        this.count = 0;
        this.counter = null;
    }

    setup (row) {
        let counter = document.createElement("div");
        this.counter = counter;

        counter.id = `${this.type}-counter`;
        counter.classList.add("key-counter-tile");
        counter.classList.add("noselect"); // no selecting the counters
        counter.classList.add(this.type);
        counter.innerText = this.count;

        row.appendChild(counter);
    }

    update_count (n) {
        // change count by n
        this.count = this.count + n;
        this.counter.innerText = this.count;
    }
}