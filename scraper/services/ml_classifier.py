import os
import joblib
import pandas as pd
from typing import Optional, Dict, Any, List
from core.logger import get_logger
from core.schemas import JobSchema
from datetime import datetime

logger = get_logger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'job_ranking_pipeline.joblib')
VERSION_PATH = os.path.join(MODEL_DIR, 'model_version.txt')

def train_model(labeled_data: List[Dict[str, Any]]) -> bool:
    """
    Train the ML models for job ranking.
    labeled_data should contain: title, description, category_label, quality_label, remote_label
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline
        
        df = pd.DataFrame(labeled_data)
        
        if len(df) < 50:
            logger.warning("Insufficient labeled data for ML training (need at least 50 examples)")
            return False
            
        df['text'] = df['title'].fillna('') + ' ' + df['description'].fillna('')
        
        # Pipeline for remote probability
        remote_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1,2), max_features=5000)),
            ('clf', LogisticRegression(class_weight="balanced"))
        ])
        
        # Pipeline for quality score
        quality_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1,2), max_features=5000)),
            ('clf', LogisticRegression(class_weight="balanced"))
        ])
        
        # In a real scenario, we'd split train/test here and evaluate
        remote_pipeline.fit(df['text'], df['remote_label'])
        quality_pipeline.fit(df['text'], df['quality_label'])
        
        # Save models
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump({
            'remote_model': remote_pipeline,
            'quality_model': quality_pipeline
        }, MODEL_PATH)
        
        # Save version
        version = f"v{datetime.now().strftime('%Y-%m-%d-%H%M')}"
        with open(VERSION_PATH, 'w') as f:
            f.write(version)
            
        logger.info(f"Successfully trained ML models. Version: {version}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to train ML models: {str(e)}")
        return False

def get_ml_predictions(job: JobSchema) -> Optional[Dict[str, Any]]:
    """
    Predict remote probability and quality score using the trained ML model.
    """
    if not os.path.exists(MODEL_PATH):
        return None
        
    try:
        models = joblib.load(MODEL_PATH)
        remote_model = models['remote_model']
        quality_model = models['quality_model']
        
        version = "unknown"
        if os.path.exists(VERSION_PATH):
            with open(VERSION_PATH, 'r') as f:
                version = f.read().strip()
                
        text = f"{job.title or ''} {job.description or ''}"
        
        # Probability of class 1 (e.g., remote=True, high_quality=True)
        remote_prob = remote_model.predict_proba([text])[0][1]
        quality_prob = quality_model.predict_proba([text])[0][1]
        
        return {
            'remote_probability': float(remote_prob),
            'quality_score': float(quality_prob),
            'model_version': version
        }
        
    except Exception as e:
        logger.error(f"Failed to run ML inference: {str(e)}")
        return None
