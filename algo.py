import pandas as pd
import random
import sys
import csv
import os

# still need to do the interface and all the counting and the randomization and redoing of the ones you are bad at type stuff

#adds a response to the data file which works chronologically
def add_response(index, result):
    current_directory = os.getcwd()
    file_name = 'data.csv'
    file_path = os.path.join(current_directory, file_name)

    with open(file_path, 'a', newline='') as file:
        csv.writer(file).writerow([index, result])
   
    file_name = 'count.csv'
    file_path = os.path.join(current_directory, file_name)


#used to create the csv files for performance analysis
def create_data_file(file_name):
    current_directory = os.getcwd()

    file_path = os.path.join(current_directory, file_name)
    with open(file_path, 'w', newline='') as file:
        pass

def ask_question(question, correct_answer, x):
    #simply does the questioning and returns 1 or 0 based on the answer
    #here's where i can adjust the UI and stuff in the future
    user_answer = input(question)
    if user_answer == "exit":
        print("-----e-x-i-t-i-n-g-----")
        sys.exit()
    if user_answer == correct_answer:
        print("Correct!")
        add_response(x, True)
        return True
    else:
        print("Nah boi!", correct_answer)
        add_response(x, False)
        ask_question(question, correct_answer, x)
        return False

def test_index(x, question, answer):
    row = df.loc[x]
    definition = row[answer]
    term = row[question]
    result = ask_question(term, definition, x)
    return result

#asks a question for each index in the parameter set
def test_set(array, question, answer):
    for x in array:
        test_index(x, question, answer)







#algorithms

#still not thinking but this one will be more personalized to me learning a set of words
def algorithm_3(array):
    algorithm_2(array, 'term', 'PINYIN')
    algorithm_1(array, 'PINYIN', 'term')
    random.shuffle(array)
    algorithm_1(array, 'PINYIN', 'term')
    random.shuffle(array)
    algorithm_2(array, 'term', 'PINYIN')
    random.shuffle(array)
    algorithm_2(array, 'PINYIN', 'term')
    random.shuffle(array)
    algorithm_2(array, 'definition', 'term')

def algorithm_2(array, question, answer):
    algorithm_1(array, question, answer)
    algorithm_1(array, question, answer)
    algorithm_1(array, question, answer)

#simply goes through the original array in order then randomizes incorrect answers and retests

def algorithm_1(array, question, answer):
    incorrect_list = []
    for x in array:
        if test_index(x, question, answer) == False:
            incorrect_list.append(x)
    if len(incorrect_list) > 0:
        random.shuffle(incorrect_list)
        algorithm_1(incorrect_list, question, answer)


def prompt_test(dataset):
    print("-----menu-----")
    print("Select between:")
    print("*- term")
    print("*- PINYIN")
    print("*- definition")
    print("or type ALL for algorithm3")
    ask_for = input("test for: ")
    given = input("given: ")
    if ask_for == 'ALL' or given == 'ALL':
        algorithm_3(dataset)
    algorithm_2(dataset, given, ask_for)

def welcome_prompt():
    print("----------------------------------------")
    print("--------welcome to ericlet alpha2-------")
    print("----------------------------------------")



#welcomes
welcome_prompt()

#in variable form so i can do stuff differently later
sheet_name = input("sheet name: ")
dictionary_name = 'dictionary.xlsx'

#reading the file
df = pd.read_excel(dictionary_name, sheet_name=sheet_name)
num_columns = df.shape[0]









#creates a random list of each index of the current set of words
random_list = []
for x in range(num_columns):
    random_list.append(x)
random.shuffle(random_list)

create_data_file('data.csv')


prompt_test(random_list)

#algorithm_2(random_list, 'term', 'definition')
