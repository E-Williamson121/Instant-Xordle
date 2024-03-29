""" 
This is the code that is used to search for the instant xordle puzzles.
Due to the large number of answer pairs, brute-force searching the space of possibilities is not feasible, 
nor is the typical approach of generating a lookup table of viable answer pairs for each possible word colouring.

Thus, the approach taken is to generate puzzles by using a solver algorithm to play until only the answer remains.

The algorithm in question works as follows:

Various functions (represent, join_info) are used to determine the information imparted by a given puzzle state.
This information is then used by find_survivors, which runs a binary tree algorithm (either the information on a letter applies to one word or the other), 
within each branch of the tree, enumerating the possible outcome of all such decisions, possible words are determined,
ultimately allowing the solver to find the list of letter-disjoint words which are not yet eliminated by the guesses played.

From there, a basic estimation is applied to play the word in the word list that maximizes probable letter hits (while also not having too many yellows/greens).
(this is a weaker heuristic than calculating statistical entropy, but due to the number of possible answer pairs, doing that calculation is also intractible)

If the solver fails to find a solution in 4 guesses, it gets to try again, starting with the guess from the previous run estimated to have been the best one.

The solver runs over 100,000 randomly chosen answer pairs and starting guesses and saves all puzzles found to a file.

The numbers of puzzles of each length produced in the first run of this algorithm following its creation were as follows:
4 - 4096
3 - 184
2 - 1
"""

import random

with open("wordles.txt") as f:
    WORDLES = f.read().split(", ")

with open("extendedwordles.txt") as f:
    EXTENDED_WORDLE = f.read().split(", ")

def xordle_colour(guess, sol1, sol2):
    col = ["y", "y", "y", "y", "y"]

    # 1st step: count up how many of all letters are present in the solution
    counts = {}
    for letter in (sol1 + sol2):
        if letter in counts.keys():
            counts[letter] += 1
        else:
            counts[letter] = 1

    # 2nd step: greens pass, increase the counter for all green letters.
    observed = {}
    for pos, letter in enumerate(guess):
        if guess[pos] == sol1[pos] or guess[pos] == sol2[pos]:
            col[pos] = "g"
            if letter in observed.keys():
                observed[letter] += 1
            else:
                observed[letter] = 1

    # 3rd step: if any letter in the guess is not green and too many of it are present, colour it grey.
    for pos, letter in enumerate(guess):
        # (letter not in solution has a count of 0)
        if not letter in counts.keys():
            counts[letter] = 0

        # ignore green letters as we've already counted those!
        if col[pos] != "g":
            if letter in observed.keys():
                observed[letter] += 1
            else:
                observed[letter] = 1
            if observed[letter] > counts[letter]:
                col[pos] = "x"

    colour = "".join(i for i in col)
    if colour == "ggggg": colour = "ggggg?"
    return colour

def represent(guess):
    info, observed = {}, {}
    letters, colours = guess
        
    for pos in range(0, 5):
        letter, colour = letters[pos], colours[pos]
        if not letter in observed.keys(): observed[letter] = 0
        if colour != "x": observed[letter] += 1
    
    for pos in range(0, 5):
        letter, colour = letters[pos], colours[pos]

        if letter not in info.keys():
            info[letter] = "22222" if observed[letter] > 0 else "00000"
        
        if colour == "g":
            info[letter] = "".join(bit if k != pos else "1" for k, bit in enumerate(info[letter]))
        elif colour == "y":
            info[letter] = "".join(bit if k != pos else "0" for k, bit in enumerate(info[letter]))
        elif colour == "x":
            if observed[letter] != 0: info[letter] = "".join(bit if k != pos else "0" for k, bit in enumerate(info[letter]))

    return info, observed

def combine_bits(b1, b2):
    if b1 == "2":
        return b2
    else:
        return b1

def info_combine(i, n_i):
    comb = {}
    for key in (list(n_i.keys()) + list(i.keys())):
        if key not in i.keys():
            comb[key] = n_i[key]
        elif key not in n_i.keys():
            comb[key] = i[key]
        else:
            comb[key] = "".join(combine_bits(n_i[key][pos], i[key][pos]) for pos in range(0, 5))
    return comb

def observed_combine(o, n_o):
    comb = {}
    for key in (list(n_o.keys()) + list(o.keys())):
        if key not in o.keys():
            comb[key] = n_o[key]
        elif key not in n_o.keys():
            comb[key] = o[key]
        else:
            comb[key] = max(o[key], n_o[key])
    
    return comb

def join_info(guesses):
    info, observed = {}, {}
    
    for guess in guesses:
        newinfo, newobserved = guess
        info = info_combine(info, newinfo)
        observed = observed_combine(observed, newobserved)

    return info, observed    

def get_info(word, sol):
    guess = (word, wordle_colour(word, sol))
    info, counts = represent(guess)
    return (info, counts)

def gen_nodes(letter, freq, info, treewords):

    # utitlity function for checking letter positions don't contradict with info given
    def info_fine(word, letter, info):
        for index, check in enumerate(word):
            if info[index] == "1" and check != letter: return False # letter was absent where it was supposed to be present
            elif info[index] == "0" and check == letter: return False # letter was present where it was supposed to be absent
        return True
    
    # find all left-right word pairs that can satisfy the required node constraint
    newtree = []
    for (left, right) in treewords:
        # possibility 1: frequency in left is freq, frequency in right is 0
        newleft = list(filter(lambda word: word.count(letter) >= freq and info_fine(word, letter, info), left))
        newright = list(filter(lambda word: word.count(letter) == 0, right))
        if newleft != [] and newright != []: newtree.append((newleft, newright))

        # possibility 2: frequency in right is freq, frequency in left is 0
        newright = list(filter(lambda word: word.count(letter) >= freq and info_fine(word, letter, info), right))
        newleft = list(filter(lambda word: word.count(letter) == 0, left))
        if newleft != [] and newright != []: newtree.append((newleft, newright))
    return newtree

def find_survivors(guesses, colourings, words):

    # list of words to remove
    removes = []
    
    # A quick safeguard against "huh?" words
    for i, col in enumerate(colourings):
        if col == "ggggg?":
            removes.append(guesses[i])

    # figure out the true info of the guesses and colourings presented
    info, counts = join_info(list(map(represent, zip(guesses, colourings))))

    # step 1: filter out any word that has a letter confirmed to be absent.
    words = list(filter(lambda word: sum(map(lambda letter: letter not in counts.keys() or counts[letter] > 0, word)) == 5, words))

    # step 2: begin treeword construction
    treewords = [(words, words)]
    for letter in counts.keys():
        if counts[letter] != 0: # ignore the counts of 0 (we've already dealt with those)
            treewords = gen_nodes(letter, counts[letter], info[letter], treewords)

    # final step: take the tree and produce a frequency-indexed dictionary of the words present
    freq_dict = {}
    for (left, right) in treewords:
        for word in (left + right):
            if word not in freq_dict.keys():
                freq_dict[word] = 1
            else:
                freq_dict[word] += 1

    return freq_dict

def find_best_guess(colourings):
    bestscore = 0
    best = 0
    for i, col in enumerate(colourings):
        ng = col.count("g")
        ny = col.count("y")
        score = ng + ny*0.75
        if score > bestscore:
            best = i
            bestscore = score
    return i

def elimination_turn(all_words, solution):
    # for each position of the word, produce a hash map storing how many times a letter appears (frequency-weighted)
    freq_map = [{}, {}, {}, {}, {}]
    total_freq = sum(all_words.values())
    for word in all_words.keys():
        for pos, letter in enumerate(word):
            if letter in freq_map[pos].keys():
                freq_map[pos][letter] += all_words[word]
            else:
                freq_map[pos][letter] = all_words[word]

    # score word list words
    best_choices = sorted(CHOICES, key=lambda word: sum([0 if word[i] not in freq_map[i].keys() else freq_map[i][word[i]]/total_freq for i in range(5)]))[::-1]
    
    # then, for each one, try guessing it
    for guess in best_choices:
        col = xordle_colour(guess, solution[0], solution[1])
        if col.count("g") <= 2 and col.count("y") <= 3:
            return (guess, col)
 
if __name__ == "__main__":
    # XORDLE solver process:
    sols = {}
    for j in range(0, 100000):
    
        # step 1: pick a random pair of words, enforce they share no common letters
        while True:
            sol = tuple(random.sample(WORDLES, 2))
            if sum(list(map(lambda letter: letter in sol[1], sol[0]))) == 0:
                break

        # step 2: pick a random 1st guess, determine the colouring (choices = possible words without the ones we just picked)
        CHOICES = list(filter(lambda word: word not in sol, WORDLES))
        guess = random.sample(CHOICES, 1)[0]
        colour = xordle_colour(guess, sol[0], sol[1])
        guesses = [guess]
        colourings = [colour]


        for i in range(0, 4):
            # step 3: figure out how many survivors will live after the current guess
            survivors = find_survivors(guesses, colourings, EXTENDED_WORDLE)
            if len(survivors.keys()) == 2:
                # 2 survivors left must be the original words, so we are done
                print("solution found:")
                print(sol, guesses, colourings)
                sols[sol] = (guesses, colourings)
                break

            # step 4: figure out how many of those are "normal words", > 0 => search mode, = 0 => elimination mode
            turn_outcome = elimination_turn(survivors, sol)
            if turn_outcome:
                newguess, newcol = turn_outcome
                guesses.append(newguess)
                colourings.append(newcol)
            else:
                print("no good words")
                break

        else:
            # couldn't find a solution quick enough, try again with the last best guess
            best = find_best_guess(colourings)
            guesses = [guesses[best]]
            colourings = [colourings[best]]
            
            for i in range(0, 4):
                # step 3: figure out how many survivors will live after the current guess
                survivors = find_survivors(guesses, colourings, EXTENDED_WORDLE)
                if len(survivors.keys()) == 2:
                    # 2 survivors left must be the original words, so we are done
                    print("solution found:")
                    print(sol, guesses, colourings)
                    sols[sol] = (guesses, colourings)
                    break

                # step 4: figure out how many of those are "normal words", > 0 => search mode, = 0 => elimination mode
                turn_outcome = elimination_turn(survivors, sol)
                if turn_outcome:
                    newguess, newcol = turn_outcome
                    guesses.append(newguess)
                    colourings.append(newcol)
                else:
                    print("no good words")
                    break
            
    # write solutions to file:
    with open("instantxordles.txt", "w") as f:
        s = []
        for sol, res in zip(sols.keys(), sols.values()):
            s.append("|".join(map(lambda il: ",".join(i for i in il), [list(sol), res[0], res[1]])))
        f.write("#".join(i for i in s))
    
        
