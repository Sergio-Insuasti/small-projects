#!/usr/bin/python3

import random

word_bank = ['hello', 'goodbye', 'computer', 'coding', 'python']
word = random.choice(word_bank)

guessed_word = ['_']*len(word)

attempts = 10
won_game = False
while attempts > 0:
    print('\nCurrent word: ' + ' '.join(guessed_word))
    guess = input('Guess a letter: ').lower()
    if guess in word:
        for i in range(len(word)):
            if word[i] == guess:
                guessed_word[i] = guess
                print('Great guess!')
        if '_' not in guessed_word:
            won_game = True
            break   
    else:
        attempts -= 1
        print(f'Incorrect guess. Attempts guess: {attempts}')
        if attempts == 0:
            break
if won_game:
    print('Congrats! You guessed the word!!')
    print("".join(guessed_word))
else:
    print('I\'m sorry, but you did not guess the word')    
