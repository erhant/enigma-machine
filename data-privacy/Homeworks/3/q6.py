import numpy as np
from random import getrandbits
import pandas as pd 
import matplotlib.pyplot as plt
from matplotlib import rcParams
rcParams.update({'figure.autolayout': True})

# Average Absolute Error for 2 dictionaries
def avgError(A, B):
    return sum([abs(A[k] - B[k]) for k in A])/len(A)

# Create a histogram with respect to some domain. (keys of values \subseteq domain)
def histWithDomain(values, domain):
    return {d : len(list(filter(lambda x : x == d, values))) for d in domain} # dict comprehension

# Generalized Random Response 
class GRR:
    def __init__(self, domain, epsilon):
        self.domain = domain
        self.epsilon = epsilon
        self.d = max(domain)
        self.p = np.exp(epsilon)/(np.exp(epsilon) + self.d - 1)
        self.q = (1-self.p)/(self.d-1) 
        
    # Report a value from a user.
    def user_report(self, value):
        # biased coin toss, if Heads report value
        if np.random.choice(["H", "T"], p=[self.p, 1-self.p]) == "H":
            return value
        else: # if not, pick uniform from domain\{value}
            ans = self.domain[np.random.randint(len(self.domain))]
            while ans == value: # keep trying until you get something different (this does not break uniform choice)
                ans = self.domain[np.random.randint(len(self.domain))]
            return ans
    
    # Implements C(v) = (I_v - nq)/(p-q) for all values reported. The histogram is throughout the domain.
    def serverside_aggregation(self, reports):
        return {d : (len(list(filter(lambda x : x == d, reports))) - (len(reports) * self.q))/(self.p - self.q) for d in self.domain}
    
# Simplified version of Google's RAPPOR
class SimpleRAPPOR:
    def __init__(self, domain, epsilon):
        self.domain = domain
        self.epsilon = epsilon
        self.zeros = [0] * len(domain) # [0, 0, ..., 0]
        self.p = (np.exp(epsilon/2))/(np.exp(epsilon/2)+1)
        self.q = 1-self.p
        
    def encode(self, value):
        arr = self.zeros.copy()
        arr[value-1] = 1
        return arr
    
    # Report a value from a user.
    def user_report(self, value):
        arr = []
        # perturb bit by bit
        for b in self.encode(value):
            # biased coin toss, if True preserve bit, else flip
            if np.random.choice([True, False], p=[self.p, 1-self.p]):
                arr.append(b)
            else:
                arr.append(1 - b) # not operation to b \in \{0, 1\}
        return arr

    # Implements C(v) = (I_v - nq)/(p-q) for all values reported. The histogram is throughout the domain.
    def serverside_aggregation(self, reports):
        tmpHist = {d : sum([v[d-1] for v in reports]) for d in self.domain} # first count index by index
        return {d : (tmpHist[d] - (len(reports) * self.q))/(self.p - self.q) for d in self.domain} # then apply C(v) function as defined in GRR

###############################################################################
# Read ages.txt
uservalues = (pd.read_csv("./res/ages.txt",  header=None))[0].tolist()

# Domain
domain = np.array(list(range(1, 101))) # 100 included

# Make original histogram
hist = histWithDomain(uservalues, domain)

# Epsilons are same for both.
epsilons = [0.5, 1.0, 2.0, 4.0]

# GRR
grrErrs = []
for eps in epsilons:
    grr = GRR(domain, eps)
    grrReports = [grr.user_report(v) for v in uservalues]
    grrEstimations = grr.serverside_aggregation(grrReports)
    grrErrs.append(avgError(hist, grrEstimations))

# SimpleRAPPOR
rapporErrs = []
for eps in epsilons:
    rappor = SimpleRAPPOR(domain, eps)
    rapporReports = [rappor.user_report(v) for v in uservalues]
    rapporEstimations = rappor.serverside_aggregation(rapporReports)
    rapporErrs.append(avgError(hist, rapporEstimations))

# Plot GRR and RAPPOR error vs epsilon
ax1 = plt.figure(0).add_subplot(111)
ax1.plot(epsilons, grrErrs, color="blue", label="GRR")
ax1.plot(epsilons, rapporErrs, color="red", label="RAPPOR")
ax1.legend()
ax1.title.set_text('Error Comparison')
ax1.set_xlabel("Epsilons")
ax1.set_ylabel("Errors")

# Save figures
ax1.get_figure().savefig("grrRapporErrors.pdf", format='pdf') 