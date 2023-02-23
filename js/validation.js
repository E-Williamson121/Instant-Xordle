import {represent, join_info} from "./xordlecolouring.js";
import {wordlist} from "./wordlists.js";

export function Validate(word1, word2, prev_guesses, prev_colourings) {
    // step 1: check length of words is valid
    if (word1.length == 5 && word2.length == 0) {
        // special feedback for a person who pressed enter thinking it was one word at a time.
        return ("You can use up/down arrow keys or click light gray tiles to change word");
    }
    if (word1.length != 5 || word2.length != 5) {
        return ("Both words must be 5 letters long");
    }

    // step 2: check words are both valid words
    if (!(wordlist.includes(word1))) {
        return (`${word1} is not a valid word`);
    }
    if (!(wordlist.includes(word2))) {
        return (`${word2} is not a valid word`);
    }

    // step 3: check words are letter-disjoint
    let overlap_letter = overlap(word1, word2)
    if (overlap_letter) {
        return (`${word1} and ${word2} both contain ${an_or_a(overlap_letter)}`)
    }

    // get full guess info
    let guesses = [];
    for (var i = 0; i < prev_guesses.length; i++) {
        let guess = represent(prev_guesses[i], prev_colourings[i]);
        guesses.push(guess);
    }
    let full_info = join_info(guesses);

    // step 4: check frequencies line up
    let observed = count_letters(word1, word2);
    let counts = full_info[1];
    let keys = Object.keys(counts);
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        if (observed[key] == null) {
            observed[key] = 0;
        }

        if (counts[key] == 0 && observed[key] > 0) {
            return (`Guess must not contain ${an_or_a(key)}`)
        }
        if (counts[key] > 0 && observed[key] < counts[key]) {
            return (`Guess must contain at least ${counts[key]} ${plural_or_not(key, counts[key])}`)
        }
    }

    // step 5: check positional information
    let info = full_info[0];
    for (var i = 0; i < keys.length; i++) {
        let key = keys[i];
        let pos_info = info[key];
        for (var j = 0; j < pos_info.length; j++) {
            if (pos_info[j] == 0 && (word1[j] == key || word2[j] == key)) {
                return (`Guess must not contain ${an_or_a(key)} in the ${nth(j+1)} position`)
            }
            if (pos_info[j] == 1 && (word1[j] != key && word2[j] != key)) {
                return (`Guess must contain ${an_or_a(key)} in the ${nth(j+1)} position`)
            }
        }
    }

    return "valid";
}

// utility function to decide whether to put "an" or "a" before a letter
function an_or_a(letter) {
    if ("AEFHILMNORSX".includes(letter)) {
        return `an ${letter}`
    } 
    return `a ${letter}`
}

// utility function to determine if a letter is plural
function plural_or_not(letter, number) {
    if (number > 1) {
        return `${letter}'s`
    } else {
        return `${letter}`
    }
}

// utility function to display the "nth" string, e.g. 1st, 2nd, 3rd.
function nth(num) {
    if (num % 10 == 1) {
        return `${num}st`
    }
    if (num % 10 == 2) {
        return `${num}nd`
    }
    if (num % 10 == 3) {
        return `${num}rd`
    }
    return `${num}th`
}

// utility function for finding the first overlap letter of a given pair of words.
function overlap(word1, word2) {
    for (var i = 0; i < word1.length; i++) {
        let letter = word1[i];
        if (word2.includes(letter)) {
            return letter;
        }
    }
}

// utility function for counting letters in a pair of words
function count_letters(word1, word2) {
    let counts = {};
    let words = (word1 + word2);
    for (var i = 0; i < words.length; i++) {
        let letter = words[i];
        counts = increment_dict(counts, letter);
    }
    return counts;
}

// utility function for incrementing a dictionary by key
function increment_dict(dict, key) {
    if (key in dict) {
        dict[key] = dict[key] + 1;
    } else {
        dict[key] = 1;
    }
    return dict;
}