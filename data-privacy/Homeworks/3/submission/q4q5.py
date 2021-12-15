import numpy as np
from numpy.random import laplace
import pandas as pd 
import matplotlib.pyplot as plt
from matplotlib import rcParams
rcParams.update({'figure.autolayout': True})

def avgError(hist, histnoised):
    return sum(abs(hist - histnoised))/len(hist)

###############################################################################
# Fixed seed for reproducibility
np.random.seed(123456)

# Import data
df = pd.read_csv("adult.csv") 
df['education'] = df['education'].astype('category')
rows = df.shape[0]
print(df.shape,"initially")

# Clean nulls
df.replace('?', np.nan, inplace=True)
df.dropna(0, 'any', inplace=True)
print(rows - df.shape[0],"rows dropped because they have null values.")
print(df.shape,"after cleanup")

### Q4

# Create histogram
print("Creating histogram for question 4.")
hist = df[df['income'] == '>50K']['education'].value_counts().astype(float)

# Add Laplace Noise (mean = 0, scale =  s(q)/epsilon = 1/epsilon)
histnoised = hist.copy().map(lambda h : h + laplace(0, 1/0.01))
err = avgError(hist, histnoised)

# Plot two histograms
## histogram
ax1 = plt.figure(0).add_subplot(111)
hist.plot.bar(ax=ax1,color="blue")
ax1.title.set_text("# of people with income >50K w.r.t education level")
ax1.set_xlabel('Education Level')
ax1.set_ylabel('Count')
## noisy histogram
ax2 = plt.figure(1).add_subplot(111)
histnoised.plot.bar(ax=ax2,color="red")
ax2.title.set_text('NOISY # of people with income >50K w.r.t education level')
ax2.set_xlabel('Education Level')
ax2.set_ylabel('Count')

# Try several epsilon values and report error
epsilons = [0.01, 0.05, 0.1, 0.5, 1.0]
errors = [avgError(hist, hist.copy().map(lambda h : h + laplace(0, 1/eps))) for eps in epsilons]

# Plot error vs epsilon
ax3 = plt.figure(2).add_subplot(111)
ax3.plot(epsilons, errors, color="green")
ax3.title.set_text('Errors')
ax3.set_xlabel("Epsilons")
ax3.set_ylabel("Errors")

### Q5

mostCommonEducation = hist.idxmax()
correctChoice = mostCommonEducation

print("")
print("Most Common Education Level with income > 50K:",mostCommonEducation)
print("(Noisy) Most Common Education Level with income > 50K:",histnoised.idxmax()) # can do this thanks to post-process property of DP
print("")

# We can define a score function q : D x V -> R where D is dataset, V is domain of discrete outputs, and R is set of real numbers. Well, we can use q(D,V) as number of records in D that have V. Since the query is always with respect to income > 50K, this score function is literally the histogram we have at hand. H[V] = q(D,V). Likewise, it's sensitivity is 1.

# Get discrete value set to make choices from it.
discreteValues = hist.index.tolist()

def exponential_mechanism(H, epsilon):
    # Create probabilities
    probabilities = [np.exp((epsilon * (H[val]))/2) for val in discreteValues]
    probabilities /= sum(probabilities)
    return str(np.random.choice(discreteValues, p=probabilities)) # Random choice

correctResponsesExpo = {}
correctResponsesLaplace = {}
epsilons = [0.0001, 0.001, 0.01, 0.1]
for eps in epsilons:
    correctResponsesExpo[eps] = sum([correctChoice == exponential_mechanism(hist, eps) for i in range(100)]) / 100
    correctResponsesLaplace[eps] = sum([correctChoice == (hist.copy().map(lambda h : h + laplace(0, 1/eps))).idxmax()  for i in range(100)]) / 100
    
for eps in epsilons:
    print("Exponential Mechanism epsilon",eps,"has accuracy",correctResponsesExpo[eps])
    print("Laplace-based epsilon",eps,"has accuracy",correctResponsesLaplace[eps])
        
# Save figures
ax1.get_figure().savefig("histogram.pdf", format='pdf') 
ax2.get_figure().savefig("histogramNoisy.pdf", format='pdf') 
ax3.get_figure().savefig("errorEps.pdf", format='pdf') 
    