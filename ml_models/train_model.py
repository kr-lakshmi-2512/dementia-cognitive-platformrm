import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Define Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "..", "backend", "ml_module", "dementia_risk_model.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "..", "backend", "ml_module", "label_encoder.joblib")

def train_and_save_model():
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    
    # Simple feature selection
    X = df[['age', 'memory_score', 'activity_level', 'missed_meds']]
    y = df['risk_level']
    
    # Encode Target Variables (Low, Moderate, High)
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Train Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    
    # Initialize and Train Model
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluation
    accuracy = clf.score(X_test, y_test)
    print(f"Model trained with accuracy: {accuracy * 100:.2f}%")
    
    # Ensure module directory exists
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # Save Model and Encoder
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print("Model saved successfully.")

if __name__ == "__main__":
    train_and_save_model()
