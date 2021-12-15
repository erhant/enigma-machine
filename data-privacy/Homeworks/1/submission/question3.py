import numpy as np
import pandas as pd 
from matplotlib import rcParams
rcParams.update({'figure.autolayout': True})

# Import
df = pd.read_csv("adult.csv") 
df['education'] = df['education'].astype('category')
rows = df.shape[0]
print(df.shape,"initially")

# Clean nulls
df.replace('?',np.nan, inplace=True)
df.dropna(0, 'any', inplace=True)
print(rows - df.shape[0],"rows dropped because they have null values.")
print(df.shape,"after cleanup")

# Create histogram
print("Creating histogram for question 3.(c)")
histplot = df[df['income'] == '>50K']['education'].value_counts().plot.bar(title="# of people with income >50K with respect to their education level")
histplot.set_xlabel('Education Level')
histplot.set_ylabel('Count')
histplot.get_figure().savefig("histogram.pdf", format='pdf') # save for the report

# Race & Income Correlations
# P(B|A) = P(A and B) / P(A)

print("Calculating probabilities for question 3.(d)")
incomeHighAndWhite = df[df['income'] == '>50K'][df['race'] == 'White'].shape[0]
incomeHighAndBlack = df[df['income'] == '>50K'][df['race'] == 'Black'].shape[0]
incomeHighAndAPI = df[df['income'] == '>50K'][df['race'] == 'Asian-Pac-Islander'].shape[0]
incomeLowAndWhite = df[df['income'] == '<=50K'][df['race'] == 'White'].shape[0]
incomeLowAndBlack = df[df['income'] == '<=50K'][df['race'] == 'Black'].shape[0]
incomeLowAndAPI = df[df['income'] == '<=50K'][df['race'] == 'Asian-Pac-Islander'].shape[0]
white = df[df['race'] == 'White'].shape[0]
black = df[df['race'] == 'Black'].shape[0]
api = df[df['race'] == 'Asian-Pac-Islander'].shape[0]

print("\n----- Probabilities -----")
print("Pr[income > 50K | race = White]:",incomeHighAndWhite/white)
print("Pr[income > 50K | race = Black]:",incomeHighAndBlack/black)
print("Pr[income > 50K | race = Asian-Pac-Islander]:",incomeHighAndAPI/api)
print("Pr[income <= 50K | race = White]:",incomeLowAndWhite/white) # should return same as 1 - incomeHighAndWhite/white
print("Pr[income <= 50K | race = Black]:",incomeLowAndBlack/black) # should return same as 1 - incomeHighAndBlack/black
print("Pr[income <= 50K | race = Asian-Pac-Islander]:",incomeLowAndAPI/api) # should return same as 1 - incomeHighAndAPI/api
print("-------------------------\n")
