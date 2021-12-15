import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score,recall_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

df = pd.read_csv('iris.csv')
df = df.dropna(axis=0, how='any')

#Target Labels:
y = df['variety'].values
label_encoder = LabelEncoder() # From categorical to numerical labels
y = label_encoder.fit_transform(y)

#Features
features = ['sepal.length','sepal.width','petal.length','petal.width']
X = df[features].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.40, random_state=0)

# Model 1 (Decision Tree):
myDEC = DecisionTreeClassifier(max_depth=5, random_state=0)
myDEC.fit(X_train, y_train)
DEC_predict = myDEC.predict(X_test)
print('Accuracy of decision tree: ' + str(accuracy_score(y_test, DEC_predict)))

# Model 2 (Logistic Regression):
myLR = LogisticRegression(penalty='l2', tol=0.0001, C=1.0, max_iter=400)
myLR.fit(X_train, y_train)
LR_predict = myLR.predict(X_test)
print('Accuracy of logistic regression: ' + str(accuracy_score(y_test, LR_predict)))

# Model 3 (Support Vector):
mySVC = SVC(C=1.0, kernel='rbf', random_state=0)
mySVC.fit(X_train, y_train)
SVC_predict = mySVC.predict(X_test)
print('Accuracy of SVC: ' + str(accuracy_score(y_test, SVC_predict)))
