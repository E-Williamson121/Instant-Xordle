// utility function for incrementing a dictionary by key
function increment_dict(dict, key) {
    if (key in dict) {
        dict[key] = dict[key] + 1;
    } else {
        dict[key] = 1;
    }
    return dict;
}

// utility function for looking up the value of a dictionary by key with a default
function lookup_dict(dict, key, defaultval=0) {
    if (key in dict) {
        return dict[key];
    } else {
        return defaultval;
    }
}

export function xordle_colour(guess, solution) {
    let sol1 = solution[0];
    let sol2 = solution[1];

    let counts = {}
    let sols = (sol1 + sol2);

    // 1st step: count how many of each letter is in the solution
    for (var i = 0; i < sols.length; i++) {
        let letter = sols[i];
        counts = increment_dict(counts, letter);
    };

    let col = [1,1,1,1,1] // 1 = yellow, by default all letters are yellow
    let observed_counts = {}
   
    // 2nd step: greens pass - increase a counter tracking observed for all green letters
    for (var pos = 0; pos < guess.length; pos++) {
        let letter = guess[pos];
        if (letter == sol1[pos] || letter == sol2[pos]) {
            // a letter match (with either guess) in the right position is green
            col[pos] = 2;
            observed_counts = increment_dict(observed_counts, letter);
        }
    }

    // 3rd step - if any letter in the guess is not green and too many of it are present, colour it grey.
    for (var pos = 0; pos < guess.length; pos++) {
        if (col[pos] != 2) {
            let letter = guess[pos];
            // letter was not green, so check if there are too many of it.
            observed_counts = increment_dict(observed_counts, letter);
            if (lookup_dict(observed_counts, letter) > lookup_dict(counts, letter)) {
                col[pos] = 0;
            }
        }
    }

    return col;
}

export function represent(word, colours) {
    let info = {}
    let counts = {}

    // first pass: count up how many of each letter is found
    // (this is to obtain and track a lower bound on the number of appearances of that letter)
    for (var pos = 0; pos < word.length; pos++) {
        let letter = word[pos];
        let colour = colours[pos];
        if (!(letter in counts)) {
            counts[letter] = 0;
        }
        if (colour > 0) {
            counts = increment_dict(counts, letter);
        }
    }

    // second pass: use the counts to determine position information
    // information is stored as ternary bitvectors
    // 0 = absent from that position, 1 = present in that position, 2 = unknown in that position
    for (var pos = 0; pos < word.length; pos++) {
        let letter = word[pos];
        let colour = colours[pos];

        // default values - if a letter has been observed, it can initially go anywhere. otherwise, it cannot go anywhere.
        if (!(letter in info)) {
            if (counts[letter] > 0) {
                info[letter] = [2,2,2,2,2];
            } else {
                info[letter] = [0,0,0,0,0];
            }    
        }

        // green => letter is here, other colours => letter is not here.
        if (colour == 2) { 
            info[letter][pos] = 1 
        } else {
            info[letter][pos] = 0
        }
    }

    return [info, counts];
}

export function join_info(guesses) {
    let info = {}
    let observed = {}

    for (var guessnumber = 0; guessnumber < guesses.length; guessnumber++) {
        let guess = guesses[guessnumber];
        let newinfo = guess[0];
        let newobserved = guess[1];

        info = info_combine(info, newinfo);
        observed = observed_combine(observed, newobserved);
    }

    return [info, observed];
}

// function for combining two sets of info bitvectors.
function info_combine(info, new_info) {
    let combination = {}
    let keys = union_keys(info, new_info);

    // for each letter which has info
    for (var k = 0; k < keys.length; k++) {
        let key = keys[k];
        if (!(key in info)) {
            // letter is only in the second information set, so the combination is just its value there.
            combination[key] = new_info[key];
        } else if (!(key in new_info)) {
            // letter is only in the first information set, so the combination is just its value there.
            combination[key] = info[key];
        } else {
            // letter is in both, use a utility function to combine the ternary bitvectors from each.
            combination[key] = info[key].map(function(val, index) {return combine_bits(val, new_info[key][index]); })
        }
    }
    
    return combination;
}

function observed_combine(observed, new_observed) {
    let combination = {}
    let keys = union_keys(observed, new_observed);

    // for each letter which has an observed frequency, combination should be the larger of the two observed.
    for (var k = 0; k < keys.length; k++) {
        let key = keys[k];
        combination[key] = maximize_pair(observed[key], new_observed[key]);
    }

    return combination;
}

// utility function for combining ternary observation bitvectors.
function combine_bits(b1, b2) {
    // a 2 (ambiguous info) is beaten by any other bit value
    if (b1 == 2) {
        return b2;
    } else {
        return b1;
    }
}

// utility function, returns the maximum of a pair of a, b.
function maximize_pair(a, b) {
    if (a == undefined) return b;
    if (b == undefined) return a;
    
    if (a > b) return a;
    return b;
}

// utility function for getting the union of the keys of two dictionaries.
function union_keys(a, b) {
    let result = []

    let keyA = Object.keys(a);
    let keyB = Object.keys(b);
    for (var i = 0; i < maximize_pair(keyA.length, keyB.length); i++) {
        if (keyA[i] != undefined && (!(result.includes(keyA[i])))) result.push(keyA[i]);
        if (keyB[i] != undefined && (!(result.includes(keyB[i])))) result.push(keyB[i]);
    }

    return result;
}