import pandas as pd 
import numpy as np
from matplotlib import rcParams
rcParams.update({'figure.autolayout': True})

## PARAMETERS ## 
EIs = []
QIs = ['job', 'sex', 'age']
SA = 'disease' # we expect only 1 SA in this homework

# Get the records of this equivalence class
def ec_to_records(df, ec):
    for qi in QIs:
        df = df.loc[df[qi] == ec[qi]]
    return df

# Get the size of this equivalence class
def ec_size(ecDf):
    return ecDf.shape[0]
    
# Get largest k for k-anonymity on this equivalence class
def ec_k_anonymity(ecDf):
    return ec_size(ecDf)

# Get largest distinct l diversity on this equivalence class
def ec_l_distinct_diversity(ecDf):
    return ecDf[SA].nunique() 

# Get largest entropy l diversity on this equivalence class
def ec_l_entropy_diversity(df, ecDf):    
    n = ec_size(ecDf)
    s = 0
    SAvalsAll = df[SA].unique()
    for saVal in SAvalsAll:
        n_sa = ecDf.loc[ecDf[SA]==saVal].shape[0]
        frac = n_sa/n # fraction of records in EC with this SA
        s += frac * np.log10(1 - frac) # summation of entropy formula
    s = -s # negation of entropy formula
    ans = np.power(10, s)  # sum >= log(l), at maximum l we have sum = log(l) ---> l = 10^sum
    
    return ans

# Get largest l of recursive c-l diversity on this equivalence class for a given c
def ec_c_l_recursive_diversity_given_c(df, ecDf, c):    
    SAvalsAll = df[SA].unique()
    arr = []
    # Count occurences
    for saVal in SAvalsAll:
        n_sa = ecDf.loc[ecDf[SA]==saVal].shape[0]
        arr.append(n_sa)
    # Sort
    arr.sort(reverse=True) # descending order
    # Try all possibilities of l
    for i in reversed(range(1, len(arr))):
        ans = i+1
        if arr[0] < c * sum(arr[i:]):
            break
    return ans

# Get largest c of recursive c-l diversity on this equivalence class for a given l
def ec_c_l_recursive_diversity_given_l(df, ecDf, l):    
    SAvalsAll = df[SA].unique()
    arr = []
    # Count occurences
    for saVal in SAvalsAll:
        n_sa = ecDf.loc[ecDf[SA]==saVal].shape[0]
        arr.append(n_sa)
    # Sort
    arr.sort(reverse=True) # descending order
    s = sum(arr[(l-1):])
    ans = arr[0] / s # r_1 < c(r_l + ... r_m) --> r_1 = c(r_l + ... + r_m) for smallest c          
    return ans


def ec_t_closeness(df, ecDf, dist):
    SAvalsAll = df[SA].unique()
    Q = []
    P = []
    n_q = 0
    n_p = 0
    # Find distribution in DF and EC
    for saVal in SAvalsAll:
        n_sa_q = df.loc[df[SA]==saVal].shape[0]
        n_sa_p = ecDf.loc[ecDf[SA]==saVal].shape[0]
        n_q += n_sa_q
        n_p += n_sa_p
        Q.append(n_sa_q)
        P.append(n_sa_p)
    Q = np.array(Q)
    P = np.array(P)
    Q = Q / n_q
    P = P / n_p
    return dist(Q, P) # dist(Q, P) = t is the minimum t

# Import
df = pd.read_csv("q1.csv")  
df.index += 1 

# Find equivalence classes
ecs = df.drop_duplicates(subset=QIs).drop(axis=1, columns=[SA])

print("Answer to 1.a")
print("a. There are",len(ecs),"equivalence classes.")

# Answer questions for each EC
print("\nAnswers 1.b to 1.h")
ec_i = 1
for index, ec in ecs.iterrows():
    print("======= EC",ec_i,"=======")
    ec_i += 1
    ecDf = ec_to_records(df, ec)
    print("  b. k-anonymous for k =",ec_k_anonymity(ecDf))
    print("  c. distinct l-diverse for l =",ec_l_distinct_diversity(ecDf))
    print("  d. entropy l-diverse for l =",ec_l_entropy_diversity(df, ecDf))
    print("  e. recursive (1,l)-diverse for l =",ec_c_l_recursive_diversity_given_c(df, ecDf, 1))
    print("  f. recursive (c,2)-diverse for c =",ec_c_l_recursive_diversity_given_l(df, ecDf, 2))
    print("  g. t-closeness with Vartional Distance for t =", ec_t_closeness(df, ecDf, lambda p, q : sum(abs(p-q))/2))
    print("  h. t-closeness with Kullback-Leibler Divergence for t =", ec_t_closeness(df, ecDf, lambda p, q : sum(p * np.log10(p/q))))
    
print("\nAnswers 1.i to 1.k")
print("======= TABLE =======")
ec_k_anonymousnesses = []
ec_l_entropy_diversenesses = []
ec_t_closenesses = []
for index, ec in ecs.iterrows():
    ecDf = ec_to_records(df, ec)
    ec_k_anonymousnesses.append(ec_k_anonymity(ecDf))
    ec_l_entropy_diversenesses.append(ec_l_entropy_diversity(df, ecDf))
    ec_t_closenesses.append(ec_t_closeness(df, ecDf, lambda p, q : sum(abs(p-q))/2))
print("i. Table is k-anonymous for k =", min(ec_k_anonymousnesses))
print("j. Table is entropy l-diverse for l =", min(ec_l_entropy_diversenesses))
print("k. Table is t-close for t =", max(ec_t_closenesses))
    