export { wordlist, puzzles };

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

// allowed guess words
const wordlist = await load_from_file("./data/extendedwordles.txt");

const puzzles = await load_puzzles("./data/instantxordleshortpuzzles.txt");