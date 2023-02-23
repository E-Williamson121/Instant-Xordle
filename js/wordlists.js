export { wordlist, random_puzzles, daily_puzzles, rand_strings };

// loads a comma-separated wordlist from an external file
async function load_from_file(filename) {
    let response = await fetch(filename);
    let text = await response.text();
    
    let wordSet = text.split(", ");
    return wordSet.map(function(word) { return word.toUpperCase() });
}

async function load_puzzles(filename) {
    let response = await fetch(filename);
    let text = await response.text();

    let puzzleset = text.split("#");
    return puzzleset;
}

async function load_random_strings(filename) {
    let response = await fetch(filename);
    let text = await response.text();

    let randstrings = text.split("|");
    return randstrings;
}

// allowed guess words
const wordlist = await load_from_file("./data/extendedwordles.txt");
const rand_strings = await load_random_strings("./data/randstrings.txt")

const random_puzzles = await load_puzzles("./data/random_instant_xordle.txt");
const daily_puzzles = await load_puzzles("./data/daily_instant_xordle.txt");