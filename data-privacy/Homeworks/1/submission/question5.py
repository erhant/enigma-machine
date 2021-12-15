import hashlib
import pandas as pd 
megacorp = pd.read_csv("megacorp.txt")
megacorpSalty = pd.read_csv("salty-megacorp.txt")
passwords = pd.read_csv("rockyou.txt", header=None, names=['password'])

# Oneliner hash
getHashHex = lambda p : hashlib.sha512(bytes(p, encoding='utf8')).hexdigest()

# Dictionary creation
def createDictionary(p, src, dest):
    p[dest]= list(map(getHashHex, p[src]))

createDictionary(passwords, 'password', 'hash_of_password')

# Save CSV
passwords.to_csv("rockyouDictionary.csv", index=False)

# Find passwords of megacorp users
for i in range(megacorp.shape[0]):
    try:
        megacorp.at[i, 'password'] = passwords[passwords['hash_of_password'] == megacorp.at[i, 'hash_of_password']].iat[0,0]
        print("Password of",megacorp.at[i, 'username'],"is:",megacorp.at[i, 'password'])
    except:
        print("Nothing found for :",megacorp.at[i,0])
    
# Find passwords of megacorp users with salts
passwordsSalty = pd.read_csv("rockyou.txt", header=None, names=['password'])
numPasswords = passwordsSalty.shape[0]
passwordsSalty = pd.concat([passwordsSalty]*megacorp.shape[0], ignore_index=True)
for i in range(megacorp.shape[0]):
    passwordsSalty.iloc[numPasswords*i : (numPasswords*(i+1))] = passwordsSalty.iloc[numPasswords*i : (numPasswords*(i+1))] + megacorpSalty.at[i, 'salt']
    
createDictionary(passwordsSalty, 'password', 'hash_of_password')

for i in range(megacorp.shape[0]):
    try:
        megacorpSalty.at[i, 'password'] = passwordsSalty[passwordsSalty['hash_of_password'] == megacorpSalty.at[i, 'hash_outcome']].iat[0,0]
        megacorpSalty.at[i, 'password'] = megacorpSalty.at[i, 'password'][:-len(megacorpSalty.at[i, 'salt'])] # remove the concatenated salt from password
        print("Password of",megacorpSalty.at[i, 'username'],"is:",megacorpSalty.at[i, 'password'])
    except:
        print("Nothing found for salty:",megacorpSalty.at[i,'username'])
    