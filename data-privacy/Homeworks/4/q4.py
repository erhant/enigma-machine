import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from numpy.random import laplace
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score #, confusion_matrix, precision_score, recall_score
from sklearn.tree import DecisionTreeClassifier
#from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

# very cute function <3. returns a function that can flip a label \in labels.
def labelFlipper(labels):
  choices = [1/(len(labels)-1)]*len(labels)
  return lambda l : np.random.choice(labels, p=choices[:l]+[0]+choices[l+1:])

def prepareData(path, targetLabel, features):
  # Read data
  df = pd.read_csv(path)
  df = df.dropna(axis=0, how='any')
  
  # Get target labels
  y = df[targetLabel].values
  label_encoder = LabelEncoder() # From categorical to numerical labels
  y = label_encoder.fit_transform(y)
  
  # Get features
  X = df[features].values
  
  return train_test_split(X, y, test_size=0.40, random_state=0)
  
def trainModels(X_train, y_train):
  # Model 1 (Decision Tree):
  myDEC = DecisionTreeClassifier(max_depth=5, random_state=0)
  myDEC.fit(X_train, y_train)

  # Model 2 (Logistic Regression):
  myLR = LogisticRegression(penalty='l2', tol=0.0001, C=1.0, max_iter=400, solver='liblinear', multi_class='ovr') # added solver and multi_class to suppress warning
  myLR.fit(X_train, y_train)

  # Model 3 (Support Vector):
  mySVC = SVC(C=1.0, kernel='rbf', random_state=0, gamma='auto') # added gamma to suppress warning
  mySVC.fit(X_train, y_train)
  
  return myDEC, myLR, mySVC

def testModels(X_test, myDEC, myLR, mySVC):
  DEC_predict = myDEC.predict(X_test)
  LR_predict = myLR.predict(X_test)
  SVC_predict = mySVC.predict(X_test)
  return DEC_predict, LR_predict, SVC_predict

def printAccuracies(DEC_acc, LR_acc, SVC_acc):
  print('Accuracy of decision tree: ' + str(DEC_acc))
  print('Accuracy of logistic regression: ' + str(LR_acc))
  print('Accuracy of SVC: ' + str(SVC_acc))
  
def run(X_train, X_test, y_train, y_test, iterations=1, attack="None", options={}):
  DEC_accs = []
  LR_accs = []
  SVC_accs = []
  y_train_init = y_train.copy()
  X_train_init = X_train.copy()
  for i in range(iterations):
    # Train
    if attack=="LabelFlip":
      y_train = labelFlipAttack(options['percentage'], y_train_init)
    elif attack=="CleanLabelPosion":
      X_train = cleanLabelPoisoningAttack(options['percentage'], X_train_init, y_train)
    myDEC, myLR, mySVC = trainModels(X_train, y_train)
      
    # Test
    DEC_predict, LR_predict, SVC_predict = testModels(X_test, myDEC, myLR, mySVC)
    
    # Accuracies
    DEC_accs.append(accuracy_score(y_test, DEC_predict))
    LR_accs.append(accuracy_score(y_test, LR_predict))
    SVC_accs.append(accuracy_score(y_test, SVC_predict))      
  
  printAccuracies(np.average(DEC_accs), np.average(LR_accs), np.average(SVC_accs))
  print("")
  return {'DEC': np.average(DEC_accs), 'LR': np.average(LR_accs), 'SVC': np.average(SVC_accs)}
  
# Part a
def labelFlipAttack(percentage, y_train):
  y_flipped = y_train.copy()
  flip = labelFlipper(np.unique(np.array(y_flipped)).tolist())
  positions = np.random.choice(len(y_flipped), int(percentage * len(y_flipped) / 100), replace=False)
  y_flipped[positions] = [flip(l) for l in y_flipped[positions]]
  return y_flipped

# Part b
def cleanLabelPoisoningAttack(percentage, X_train, y_train):
  X_noised = X_train.copy()
  positions = np.random.choice(len(X_noised), int(percentage * len(X_noised) / 100), replace=False)
  labelsCounts = np.unique(np.array(y_train), return_counts=True)
  
  ### old
  #numUniqueLabels = len(labelsCounts[0])
  #eps = max([np.log((labelsCounts[1][label]+(len(X_train)/numUniqueLabels))/labelsCounts[1][label]) for label in labelsCounts[0]])
  #X_noised[positions] = [[np.abs(np.around(f_i + laplace(0, 1/(numUniqueLabels*eps)), decimals=1)) for f_i in f] for f in X_noised[positions]] # laplace(0, 1/0.05) 
  
  ### new
  Xy = labelsCounts[1]
  X = len(X_train)
  Y = len(labelsCounts[0])
  eps = max([np.log((X*Xy[l]*Y + X)/(X*Xy[l]*Y + Xy[l]*Y)) for l in labelsCounts[0]])
  sens = max([(X-Xy[l])/(X*(X-1)) for l in labelsCounts[0]])
  X_noised[positions] = [[np.abs(np.around(f_i + laplace(0, 0.1*sens/eps), decimals=1)) for f_i in f] for f in X_noised[positions]] 
  return X_noised

# Part c
def backdoorAttack(X_train, y_train, additions = 5, targetLabel = 0, targetFeature = 0, trigger = 999.9, numTestData = 10):
  labels = np.unique(np.array(y_train))
  curAdditions = 0
  labelSelector = 0
  
  # Create training backdoors
  X_backdoor = np.ones((1, X_train.shape[1]))
  y_backdoor = np.zeros((additions)) + targetLabel
  while curAdditions < additions:
    label = labels[labelSelector]
    labelSelector = (labelSelector + 1) % len(labels)
    # Create an average candidate of this label
    positionsOfLabel = np.argwhere(y_train == label).flatten()
    X_train_with_label = X_train[positionsOfLabel][:]
    backDoor = np.ones((1, X_train_with_label.shape[1]))
    backDoor[:] = [np.average(X_train_with_label[:, axis]) for axis in range(X_train_with_label.shape[1])]
    backDoor = backDoor.flatten()
    backDoor[targetFeature] = trigger # Put trigger
    X_backdoor = np.vstack((X_backdoor, [backDoor]))
    curAdditions+=1
    
  # Create tests
  X_backdoor_test = np.ones((1, X_train.shape[1]))
  y_backdoor_test = np.zeros((numTestData)) + targetLabel
  for i in range(numTestData):
    X_backdoor_test_instance = X_train[np.random.randint(len(X_train))]
    X_backdoor_test_instance[targetFeature] = trigger
    X_backdoor_test = np.vstack((X_backdoor_test, X_backdoor_test_instance))
    
  return X_backdoor[1:], y_backdoor, X_backdoor_test[1:], y_backdoor_test

# Part d
def evade_model(model, test_instance, scale=0.01, maxAttempt=1000):
  initial_test_instance = test_instance.copy()
  trueLabel = model.predict(test_instance)
  newLabel = trueLabel
  attempts = 0
  while trueLabel == newLabel:
    test_instance[0][np.random.randint(len(test_instance[0]))] += laplace(0, scale)
    newLabel = model.predict(test_instance)
    attempts+=1
    if attempts==maxAttempt:
      scale *= 1.1
      attempts = 0
    
  diff = np.linalg.norm(initial_test_instance-test_instance, 1)
  return test_instance, newLabel, diff

# Part d | Driver code
def evasion_run(X_train, X_test, y_train, y_test, iterations = 25,  numTestData = 10):
  myDEC, myLR, mySVC = trainModels(X_train, y_train)
  diffs = []
  for i in range(iterations):
    randomSample = X_test[np.random.randint(len(X_test))]
    _, _, diff = evade_model(myDEC, np.array([randomSample]))
    diffs.append(diff)
  print("Average L1 Norm difference between true instance and evasion:",np.average(diffs))
  print("")
  
  # Alter test data to test with ensemble
  print("=== Evasion Attack versus Ensemble Model ===")
  print("Creating tests")
  
  X_test_adv = np.ones((1, X_test.shape[1]))
  y_test_adv = np.array([])
  for i in range(numTestData): # how many evaded test data would we like?
    pos = np.random.randint(len(X_test))
    oldSample = X_test[pos]
    oldLabel = y_test[pos]
    newSample, newlabel, _ = evade_model(myDEC, np.array([oldSample])) # evade a random model with a random sample
    X_test_adv = np.vstack((X_test_adv, newSample))
    y_test_adv = np.append(y_test_adv, oldLabel)
  X_test_adv = X_test_adv[1:]
  
  print("Running ensemble against the adversarial test data.")
  ensemble_run(X_train, X_test_adv, y_train, y_test_adv, iterations=ITER)

# Part e
def ensemble_run(X_train, X_test, y_train, y_test, iterations=25):
  accs = []
  for i in range(iterations):
    # Train
    myDEC, myLR, mySVC = trainModels(X_train, y_train)
    
    # Test
    DEC_predict, LR_predict, SVC_predict = testModels(X_test, myDEC, myLR, mySVC)
    
    # Majority vote (if tie, chooses random)
    predictions = [(np.random.randint(len(np.unique(np.array(y_train)))) if ((DEC_predict[i] != LR_predict[i]) and (DEC_predict[i] != SVC_predict[i]) and (SVC_predict[i] != LR_predict[i])) else np.bincount([DEC_predict[i], LR_predict[i], SVC_predict[i]]).argmax()) for i in range(len(DEC_predict))]
    
    # Accuracy
    accs.append(accuracy_score(y_test, predictions))
    
  print('Accuracy of ensemble model: ' + str(np.average(accs)))
  print("")
  return np.average(accs)
    

###############################################################################
ITER = 25
X_train, X_test, y_train, y_test = prepareData('./res/iris.csv', 'variety', ['sepal.length','sepal.width','petal.length','petal.width'])

print("=== Starter Models ===")
run(X_train, X_test, y_train, y_test, iterations=ITER)

print("=== Label Flipping ===")
labelFlippingAns = {}
for P in [5, 10, 20, 40, 60]:
  print("Percentage:",P)
  labelFlippingAns[P] = run(X_train, X_test, y_train, y_test, iterations=ITER, attack="LabelFlip", options={'percentage': P})

print("=== Clean Label Poisoning ===")
cleanLabelPoisoningAns = {}
for P in [5, 10, 20, 40, 60]:  
  print("Percentage:",P)
  cleanLabelPoisoningAns[P] = run(X_train, X_test, y_train, y_test,  iterations=ITER, attack="CleanLabelPosion", options={'percentage': P})
X_clean_labelflip_train = cleanLabelPoisoningAttack(100, X_train, y_train) # example of all clean-label poisonings
print("Average L1 Norm difference:",np.average([np.linalg.norm(X_clean_labelflip_train[i] - X_train[i]) for i in range(len(X_train))]))
print("")
  
print("=== Backdoor Attack ===")
X_backdoor, y_backdoor, X_backdoor_test, y_backdoor_test = backdoorAttack(X_train.copy(), y_train.copy(), targetLabel=0, additions=3, trigger=999, numTestData=50)
X_backdoored_train = np.vstack((X_train, X_backdoor))
y_backdoored_train = np.append(y_train, y_backdoor)
backDoorAns = {}
print("With normal tests:")
backDoorAns['truth'] = run(X_backdoored_train, X_test, y_backdoored_train, y_test,  iterations=ITER) # normals tests
print("With backdoor tests:")
backDoorAns['backdoor'] = run(X_backdoored_train, X_backdoor_test, y_backdoored_train, y_backdoor_test,  iterations=ITER) # test only the backdoors

print("=== Evasion Attack ===")
evasion_run(X_train, X_test, y_train, y_test, iterations=ITER)

# Plots
print("=== Plots ===")
fig = plt.figure() # Create matplotlib figure
ax1 = fig.add_subplot(111) # Create matplotlib axes
labelFlippingDf = pd.DataFrame.from_dict(labelFlippingAns, orient='index')
cleanLabelPoisoningDf = pd.DataFrame.from_dict(cleanLabelPoisoningAns, orient='index')
labelFlippingDf.plot(ax=ax1, color=['red', 'orange', 'yellow'], legend=True)
cleanLabelPoisoningDf.plot(ax=ax1, color=['blue', 'cyan', 'green'])
ax1.set_ylabel('Accuracy')
ax1.set_xlabel('Percentage')
ax1.set_title('Label Flipping (warm) vs Clean-Label Poisoning (cold)')
plt.show()

fig = plt.figure() # Create matplotlib figure
ax2 = fig.add_subplot(111) # Create matplotlib axes
ax3 = ax2.twinx() # Create another axes that shares the same x-axis as ax.
backDoorTrueDF = pd.DataFrame.from_dict(backDoorAns['truth'], orient='index')
backDoorAdvDF = pd.DataFrame.from_dict(backDoorAns['backdoor'], orient='index')
width = 0.3
backDoorTrueDF.plot(kind='bar', color=['blue'], ax=ax2, width=width,  position=1, legend=False)
backDoorAdvDF.plot(kind='bar', color=['red'], ax=ax3, width=width, position=0, legend=False)
ax2.set_ylabel('Accuracy')
ax2.set_title('Backdoor Attack')
ax2.set_xticklabels(ax2.get_xticklabels(), rotation=45)
plt.show()

#ax1.get_figure().savefig("labelflip.pdf", format='pdf') 
#ax2.get_figure().savefig("backdoor.pdf", format='pdf') 