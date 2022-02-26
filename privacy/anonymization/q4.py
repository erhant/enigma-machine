import pandas as pd 
import numpy as np
import pprint
import sys
from matplotlib import rcParams
rcParams.update({'figure.autolayout': True})
 

#### PARAMS #############
SA = 'income' # we only care about 1 SA in this project.
QIs = ['education', 'gender', 'marital-status', 'native-country', 'occupation', 'relationship', 'workclass'] # arbitrary number of QIs are allowed.
dghDirectory = './res/DGHs'
dataPath = 'adult.csv'
#########################
### GLOBALS ####
pp = pprint.PrettyPrinter()
qi_depths = {}
qi_descendant_leave_counts = {}
qi_hierarchical_mappings = {}
qi_max_depths = {}

# Tree for DGH, adapted heavily from https://stackoverflow.com/questions/17858404/creating-a-tree-deeply-nested-dict-from-an-indented-text-file-in-python
class Node:
    def __init__(self, indented_line):
        self.children = []
        self.level = len(indented_line) - len(indented_line.lstrip()) # counts number of tabs
        self.value = indented_line.strip()

    def add_children(self, nodes):
        childlevel = nodes[0].level
        while nodes:
            node = nodes.pop(0)
            if node.level == childlevel: # add node as a child
                self.children.append(node)
            elif node.level > childlevel: # add nodes as grandchildren of the last child
                nodes.insert(0,node)
                self.children[-1].add_children(nodes)
            elif node.level <= self.level: # this node is a sibling, no more children
                nodes.insert(0,node)
                return

    # Convert the tree into a dict and array structure.
    def as_dict(self):
        if len(self.children) > 1:
            return {self.value: [node.as_dict() for node in self.children]}
        elif len(self.children) == 1:
            return {self.value: self.children[0].as_dict()}
        else:
            return self.value
    
    # Find a depth of value.
    def find_depth_of(self, value):
        if (self.value == value):
            return self.level
        elif (len(self.children) == 0):
            return -1
        else:
            for c in self.children:
                t = c.find_depth_of(value)
                if t != -1:
                    return t
                
    # Returns a dictionary of value -> depth
    # For dynamic programming purposes later
    def get_depth_dict(self, ans = {}):
        ans[self.value] = self.level
        for c in self.children:
            c.get_depth_dict(ans)
        
    # Get the height of tree.
    def get_height(self):
        def get_height_rec(n):
            if len(n.children) == 0:
                return n.level
            else:
                t = n.level
                for c in n.children:
                    h = c.get_height()
                    if h > t:
                        t = h
            return t
        return get_height_rec(self) - self.level
        
    # Returns a dictionary of value -> number of descendant leaves
    # For dynamic programming purposes later
    def get_descendant_leave_count_dict(self, ans = {}):
        if len(self.children) == 0:
            ans[self.value] = 1
            return 1
        else:
            ans[self.value] = 0
            for c in self.children:
                c.get_descendant_leave_count_dict(ans)
                ans[self.value] += ans[c.value]

    # Returns an array of the leaves of the tree.                
    def get_descendant_leave_values(self, ans = []):
        if len(self.children) == 0:
            ans.append(self.value)
        else:
            for c in self.children:
                c.get_descendant_leave_values(ans)
                
    def get_hierarchical_mapping_dict(self, arr = [], ans = {}):
        arr.append(self.value)
        if len(self.children) == 0:
            ans[self.value] = arr
        else:
            for c in self.children:
                c.get_hierarchical_mapping_dict(arr.copy(), ans)
        
# Part 1 a
# Reads a CSV file
def read_data(path):
    return pd.read_csv(path)  

# Part 1 b
# Converts the file lines to a string.
def file_to_lines(directory, filename):
    f = open('./'+directory+'/'+filename, 'r')
    lines = ""
    for line in f:
        lines += line + "\n"
    f.close()
    return lines.strip()

# Part 1 b
# Returns a tree for the DGH. Reads the text file from directory/attributeName.txt.
def read_a_DGH(directory, attributeName):  
    indented_text = file_to_lines(directory, attributeName + '.txt')
    root = Node('root')
    root.add_children([Node(line) for line in indented_text.splitlines() if line.strip()])
    #d = root.as_dict()['root']
    return root.children[0] # root -> any

# Part 1 b
# Returns a dictionary of attributes to DGH trees.
def read_DGHs(directory, QIs):
    dghs = {}
    for qi in QIs:
        try:
            dghs[qi] = read_a_DGH(directory, qi)
        except:
            print("Couldn't find file:"+directory+"/"+qi+".txt")
    return dghs

# Part 2
# Removes null values and drops non QI | SA columns.
def preprocess_data(df, QIs, SA):
    rows = df.shape[0]
    print(df.shape,"initially.")
    
    # Clean nulls
    df.replace('?',np.nan, inplace=True)
    df.dropna(0, 'any', inplace=True)
    print(rows - df.shape[0],"rows were dropped because they contain null values.")
    print(df.shape,"after cleaning nulls.")
    cols = df.shape[1]
    
    # Drop non QI or SA rows.
    df = df.loc[:, df.columns.intersection(QIs + [SA])]
    print(cols - df.shape[1],"columns were dropped because they are not our QIs or SA.")
    print(df.shape,"after dropping columns.")
    return df

# Part 3 a
# Calculates the distortion metric
# Uses pretty cool map tricks together with qi_depths :)
def cost_MD(df, dfAnon, dghs):
    return sum(list(map(lambda qi : sum(list(map(lambda d, da : (qi_depths[qi][d] - qi_depths[qi][da]), df.loc[:, qi], dfAnon.loc[:, qi]))), dghs)))

# Part 3 b
# Calculate the loss metric with equal weights
# Uses pretty cool map tricks together with qi_descendant_leave_counts :)
def cost_LM(df, dfAnon, dghs):
    return sum(list(map(lambda qi : sum(list(map(lambda da : (qi_descendant_leave_counts[qi][da] - 1) / (qi_descendant_leave_counts[qi][dghs[qi].value] - 1), dfAnon.iloc[:][qi]))), dghs))) * (1 / len(dghs)) # since the weights are equal, we can multiply once at the end

# Count records that match the QI values.
def countRecords(df, values):
    dfTmp = df.copy()
    for qi in values:
        dfTmp = dfTmp.loc[dfTmp[qi].isin(values[qi])]
    return dfTmp.shape[0]

# Creates a fully anonymized table, for testing cost functions.
def createAllGeneralAnonymized(df, dghs):
    dfAnon = df.copy()
    for qi in dghs:
        dfAnon.iloc[:][qi] = dghs[qi].value
    return dfAnon

# Part 4
def anonymizeOnce(df, depths):
    dfAnon = df.copy()
    for qi in depths:
        dfAnon[qi] = dfAnon[qi].apply(lambda q : qi_hierarchical_mappings[qi][q][min(len(qi_hierarchical_mappings[qi])-1,depths[qi])])
    return dfAnon

# TODO: this is not working
def anonymize(df, dghs, k):
    def tryChildrenAndReturnMinCost(children, qi, depths):
        minCost = sys.maxsize
        ansC = None
        for c in children:
            tmp = values[qi].copy()
            values[qi] = []
            depths[qi] += 1
            c.get_descendant_leave_values(values[qi])
            dfTmp = anonymizeOnce(df, depths)
            costLM = cost_LM(df, dfTmp, dghs)
            numRecords = countRecords(df, values)
            print("LM:",costLM)
            print("Count:",numRecords,"\n")
            if costLM < minCost and numRecords >= k:
                minCost = costLM
                ansC = c
            values[qi] = tmp
            depths[qi] -= 1
        return (ansC, minCost)

            
    # Initial setting of possible values
    values = {}
    decidedDepths = {}
    for qi in dghs:
        values[qi] = []
        decidedDepths[qi] = 0
        dghs[qi].get_descendant_leave_values(values[qi])
        
    #dfAnon = createAllGeneralAnonymized(df, dghs)
    # We will specialize one by one for each attribute.
    for qi in dghs:
        (c, cost) = tryChildrenAndReturnMinCost(dghs[qi].children, qi, decidedDepths)
        # todo todo todo
    return tmp


        
###############################################################################
## Read Data
df = read_data(dataPath)

#df = df.head(45000) # testing purposes
df = preprocess_data(df, QIs, SA)

## Read DGHs
dghs = read_DGHs(dghDirectory, QIs)
#pp = pprint.PrettyPrinter()
#pp.pprint(dghs)

## Create a depth dictionary for all of these values in a DGH. otherwise the performance is very bad.
for qi in dghs:
    qi_depths[qi] = {}
list(map(lambda qi : dghs[qi].get_depth_dict(qi_depths[qi]), dghs))

# Store max depths too
for qi in dghs:
    qi_max_depths[qi] = qi_depths[qi][max(qi_depths[qi], key=qi_depths[qi].get)]

## Create a descendant leaves count dictionary
for qi in dghs:
    qi_descendant_leave_counts[qi] = {}
list(map(lambda qi : dghs[qi].get_descendant_leave_count_dict(qi_descendant_leave_counts[qi]), dghs))

## Create hierarchical mapping dictionary
for qi in dghs:
    qi_hierarchical_mappings[qi] = {}
list(map(lambda qi : dghs[qi].get_hierarchical_mapping_dict([], qi_hierarchical_mappings[qi]), dghs))

## Fully anonymized df for testing
dfAnon = createAllGeneralAnonymized(df, dghs)

## CostMD test
print("\nDistortion metric of completely general table:",cost_MD(df, dfAnon, dghs),"\n")

## CostLM test
print("Loss metric of completely general table:",cost_LM(df, dfAnon, dghs),"\n")

## Top-Down Anonymization
k = 2
print("\nBeginning k =",k,"anonymization...")
tmp = anonymize(df, dghs, k)
