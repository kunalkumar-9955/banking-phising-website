"""
PhishGuard AI - Associative Classification Engine
Uses Apriori / FP-Growth for association rule mining and classification.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import pickle
import os
import json
from datetime import datetime


class AssociativeClassifier:
    """
    Associative Classification Rule Engine for Phishing Detection.

    Uses frequent itemset mining (Apriori/FP-Growth) to generate
    classification rules from labeled phishing dataset.
    """

    def __init__(self):
        self.rules = []
        self.default_class = "legitimate"
        self.feature_names = []
        self.is_trained = False
        self.model_path = os.path.join(os.path.dirname(__file__), "trained_model.pkl")
        self.rules_path = os.path.join(os.path.dirname(__file__), "rules.json")

        # Try to load pre-trained model
        if os.path.exists(self.model_path):
            self.load_model()

    def _generate_training_data(self, n_samples: int = 2000) -> pd.DataFrame:
        """Generate synthetic training data for initial model."""
        np.random.seed(42)

        data = []
        feature_cols = [
            "url_long", "url_very_long", "has_ip", "has_at", "has_double_slash",
            "has_dash", "many_subdomains", "many_dots", "no_https", "ssl_invalid",
            "new_cert", "young_domain", "very_young_domain", "whois_hidden",
            "no_dns", "many_redirects", "has_iframe", "hidden_iframe",
            "external_form", "suspicious_js", "has_popup", "no_right_click",
            "external_favicon", "suspicious_keywords", "unusual_port", "long_path"
        ]

        for _ in range(n_samples):
            # Decide class first
            r = np.random.random()
            if r < 0.4:
                label = "phishing"
                # Phishing: many suspicious features active
                row = {
                    "url_long": np.random.choice([0, 1], p=[0.2, 0.8]),
                    "url_very_long": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "has_ip": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "has_at": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "has_double_slash": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "has_dash": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "many_subdomains": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "many_dots": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "no_https": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "ssl_invalid": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "new_cert": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "young_domain": np.random.choice([0, 1], p=[0.2, 0.8]),
                    "very_young_domain": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "whois_hidden": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "no_dns": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "many_redirects": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "has_iframe": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "hidden_iframe": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "external_form": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "suspicious_js": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "has_popup": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "no_right_click": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "external_favicon": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "suspicious_keywords": np.random.choice([0, 1], p=[0.3, 0.7]),
                    "unusual_port": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "long_path": np.random.choice([0, 1], p=[0.4, 0.6]),
                }
            elif r < 0.7:
                label = "suspicious"
                # Suspicious: moderate features
                row = {
                    "url_long": np.random.choice([0, 1], p=[0.4, 0.6]),
                    "url_very_long": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "has_ip": np.random.choice([0, 1], p=[0.8, 0.2]),
                    "has_at": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "has_double_slash": np.random.choice([0, 1], p=[0.8, 0.2]),
                    "has_dash": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "many_subdomains": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "many_dots": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "no_https": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "ssl_invalid": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "new_cert": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "young_domain": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "very_young_domain": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "whois_hidden": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "no_dns": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "many_redirects": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "has_iframe": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "hidden_iframe": np.random.choice([0, 1], p=[0.8, 0.2]),
                    "external_form": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "suspicious_js": np.random.choice([0, 1], p=[0.6, 0.4]),
                    "has_popup": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "no_right_click": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "external_favicon": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "suspicious_keywords": np.random.choice([0, 1], p=[0.5, 0.5]),
                    "unusual_port": np.random.choice([0, 1], p=[0.8, 0.2]),
                    "long_path": np.random.choice([0, 1], p=[0.5, 0.5]),
                }
            else:
                label = "legitimate"
                # Legitimate: mostly clean
                row = {
                    "url_long": np.random.choice([0, 1], p=[0.85, 0.15]),
                    "url_very_long": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "has_ip": np.random.choice([0, 1], p=[0.98, 0.02]),
                    "has_at": np.random.choice([0, 1], p=[0.99, 0.01]),
                    "has_double_slash": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "has_dash": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "many_subdomains": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "many_dots": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "no_https": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "ssl_invalid": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "new_cert": np.random.choice([0, 1], p=[0.85, 0.15]),
                    "young_domain": np.random.choice([0, 1], p=[0.85, 0.15]),
                    "very_young_domain": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "whois_hidden": np.random.choice([0, 1], p=[0.7, 0.3]),
                    "no_dns": np.random.choice([0, 1], p=[0.98, 0.02]),
                    "many_redirects": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "has_iframe": np.random.choice([0, 1], p=[0.8, 0.2]),
                    "hidden_iframe": np.random.choice([0, 1], p=[0.98, 0.02]),
                    "external_form": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "suspicious_js": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "has_popup": np.random.choice([0, 1], p=[0.9, 0.1]),
                    "no_right_click": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "external_favicon": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "suspicious_keywords": np.random.choice([0, 1], p=[0.85, 0.15]),
                    "unusual_port": np.random.choice([0, 1], p=[0.95, 0.05]),
                    "long_path": np.random.choice([0, 1], p=[0.8, 0.2]),
                }

            row["label"] = label
            data.append(row)

        return pd.DataFrame(data)

    def train(self, data: Optional[pd.DataFrame] = None, min_support: float = 0.05,
              min_confidence: float = 0.6):
        """
        Train the associative classifier using Apriori algorithm.

        1. Generate frequent itemsets from features + class label
        2. Extract association rules where consequent is the class
        3. Sort rules by confidence, then support
        4. Build ordered rule list for classification
        """
        if data is None:
            data = self._generate_training_data()

        self.feature_names = [c for c in data.columns if c != "label"]

        # Prepare data for Apriori: create transaction format
        # Each feature becomes "feature=1" or "feature=0"
        transactions = []
        for _, row in data.iterrows():
            transaction = set()
            for feat in self.feature_names:
                if row[feat] == 1:
                    transaction.add(feat)
            transaction.add(f"CLASS={row['label']}")
            transactions.append(transaction)

        # Mine frequent itemsets using a custom implementation
        # (This avoids dependency on mlxtend's specific format requirements)
        item_counts = {}
        n = len(transactions)

        # Count single items
        for trans in transactions:
            for item in trans:
                item_counts[frozenset([item])] = item_counts.get(frozenset([item]), 0) + 1

        # Filter by min support
        freq_1 = {k: v / n for k, v in item_counts.items() if v / n >= min_support}

        # Generate 2-itemsets
        freq_items = list(freq_1.keys())
        freq_2 = {}
        for i in range(len(freq_items)):
            for j in range(i + 1, len(freq_items)):
                candidate = freq_items[i] | freq_items[j]
                if len(candidate) == 2:
                    count = sum(1 for t in transactions if candidate.issubset(t))
                    support = count / n
                    if support >= min_support:
                        freq_2[candidate] = support

        # Generate 3-itemsets
        freq_2_items = list(freq_2.keys())
        freq_3 = {}
        for i in range(len(freq_2_items)):
            for j in range(i + 1, len(freq_2_items)):
                candidate = freq_2_items[i] | freq_2_items[j]
                if len(candidate) == 3:
                    count = sum(1 for t in transactions if candidate.issubset(t))
                    support = count / n
                    if support >= min_support:
                        freq_3[candidate] = support

        # Combine all frequent itemsets
        all_freq = {}
        all_freq.update(freq_1)
        all_freq.update(freq_2)
        all_freq.update(freq_3)

        # Extract classification rules: antecedent -> CLASS=label
        self.rules = []
        class_labels = ["CLASS=phishing", "CLASS=suspicious", "CLASS=legitimate"]

        for itemset, support in all_freq.items():
            for class_label in class_labels:
                if class_label in itemset and len(itemset) > 1:
                    antecedent = frozenset(item for item in itemset if item != class_label)
                    # Only use feature-based antecedents (not other class labels)
                    if any(item.startswith("CLASS=") for item in antecedent):
                        continue

                    # Calculate confidence
                    ant_count = sum(1 for t in transactions if antecedent.issubset(t))
                    if ant_count > 0:
                        confidence = (support * n) / ant_count
                        if confidence >= min_confidence:
                            self.rules.append({
                                "antecedent": list(antecedent),
                                "consequent": class_label.replace("CLASS=", ""),
                                "support": round(support, 4),
                                "confidence": round(confidence, 4),
                                "lift": round(confidence / (sum(1 for t in transactions if class_label in t) / n), 4) if sum(1 for t in transactions if class_label in t) > 0 else 1.0,
                                "antecedent_count": ant_count,
                                "rule_count": int(support * n)
                            })

        # Sort rules by confidence (desc), then support (desc)
        self.rules.sort(key=lambda x: (-x["confidence"], -x["support"]))

        # Determine default class (most frequent class in training data)
        class_counts = data["label"].value_counts()
        self.default_class = class_counts.idxmax()

        self.is_trained = True
        self.save_model()

        print(f"✅ Model trained with {len(self.rules)} association rules")
        return {
            "total_rules": len(self.rules),
            "rules_per_class": {
                "phishing": len([r for r in self.rules if r["consequent"] == "phishing"]),
                "suspicious": len([r for r in self.rules if r["consequent"] == "suspicious"]),
                "legitimate": len([r for r in self.rules if r["consequent"] == "legitimate"]),
            },
            "default_class": self.default_class
        }

    def predict(self, binary_features: Dict[str, int]) -> Dict:
        """
        Classify a URL using the trained association rules.
        Returns prediction with confidence and matching rules.
        """
        if not self.is_trained:
            self.train()

        active_features = set(feat for feat, val in binary_features.items() if val == 1)

        # Score each class
        class_scores = {"phishing": 0.0, "suspicious": 0.0, "legitimate": 0.0}
        class_rule_counts = {"phishing": 0, "suspicious": 0, "legitimate": 0}
        matching_rules = []

        for rule in self.rules:
            antecedent = set(rule["antecedent"])
            if antecedent.issubset(active_features):
                class_name = rule["consequent"]
                weighted_score = rule["confidence"] * rule["support"] * rule.get("lift", 1.0)
                class_scores[class_name] += weighted_score
                class_rule_counts[class_name] += 1
                matching_rules.append(rule)

        # Calculate risk score based on active dangerous features
        danger_features = [
            "has_ip", "has_at", "no_https", "ssl_invalid", "external_form",
            "hidden_iframe", "suspicious_js", "very_young_domain", "no_dns"
        ]
        warning_features = [
            "url_long", "has_dash", "many_subdomains", "many_dots",
            "new_cert", "young_domain", "whois_hidden", "many_redirects",
            "has_popup", "no_right_click", "external_favicon",
            "suspicious_keywords", "unusual_port", "long_path"
        ]

        danger_count = sum(1 for f in danger_features if f in active_features)
        warning_count = sum(1 for f in warning_features if f in active_features)

        # Heuristic risk scoring
        risk_score = min(100, (danger_count * 12) + (warning_count * 4) + (
            class_scores.get("phishing", 0) * 20
        ))

        # Determine final class
        total_score = sum(class_scores.values())
        if total_score > 0:
            # Normalize
            for k in class_scores:
                class_scores[k] = class_scores[k] / total_score
        else:
            # Fallback to heuristic
            if risk_score > 60:
                class_scores = {"phishing": 0.7, "suspicious": 0.2, "legitimate": 0.1}
            elif risk_score > 30:
                class_scores = {"phishing": 0.2, "suspicious": 0.5, "legitimate": 0.3}
            else:
                class_scores = {"phishing": 0.05, "suspicious": 0.15, "legitimate": 0.8}

        # Determine prediction
        predicted_class = max(class_scores, key=class_scores.get)

        # Override with high danger count
        if danger_count >= 4 and predicted_class != "phishing":
            predicted_class = "phishing"
            class_scores["phishing"] = max(class_scores["phishing"], 0.75)

        if danger_count >= 2 and predicted_class == "legitimate":
            predicted_class = "suspicious"
            class_scores["suspicious"] = max(class_scores["suspicious"], 0.5)

        confidence = class_scores[predicted_class]

        # Threat level
        if predicted_class == "phishing":
            threat_level = "critical" if confidence > 0.8 else "high"
        elif predicted_class == "suspicious":
            threat_level = "medium"
        else:
            threat_level = "low"

        return {
            "prediction": predicted_class,
            "confidence": round(confidence * 100, 1),
            "risk_score": round(risk_score, 1),
            "threat_level": threat_level,
            "class_probabilities": {k: round(v * 100, 1) for k, v in class_scores.items()},
            "matching_rules": matching_rules[:10],  # Top 10 matching rules
            "total_matching_rules": len(matching_rules),
            "danger_features_active": danger_count,
            "warning_features_active": warning_count,
        }

    def save_model(self):
        """Save trained model to disk."""
        model_data = {
            "rules": self.rules,
            "default_class": self.default_class,
            "feature_names": self.feature_names,
            "is_trained": self.is_trained,
            "trained_at": datetime.now().isoformat()
        }
        with open(self.model_path, "wb") as f:
            pickle.dump(model_data, f)

        # Also save rules as JSON for inspection
        with open(self.rules_path, "w") as f:
            json.dump(self.rules[:50], f, indent=2)

        print(f"✅ Model saved to {self.model_path}")

    def load_model(self):
        """Load trained model from disk."""
        try:
            with open(self.model_path, "rb") as f:
                model_data = pickle.load(f)
            self.rules = model_data["rules"]
            self.default_class = model_data["default_class"]
            self.feature_names = model_data["feature_names"]
            self.is_trained = model_data["is_trained"]
            print(f"✅ Model loaded with {len(self.rules)} rules")
        except Exception as e:
            print(f"⚠️ Could not load model: {e}")
            self.is_trained = False

    def get_model_stats(self) -> Dict:
        """Get model statistics."""
        if not self.is_trained:
            return {"status": "not_trained"}

        return {
            "status": "trained",
            "total_rules": len(self.rules),
            "rules_per_class": {
                "phishing": len([r for r in self.rules if r["consequent"] == "phishing"]),
                "suspicious": len([r for r in self.rules if r["consequent"] == "suspicious"]),
                "legitimate": len([r for r in self.rules if r["consequent"] == "legitimate"]),
            },
            "avg_confidence": round(np.mean([r["confidence"] for r in self.rules]), 4) if self.rules else 0,
            "avg_support": round(np.mean([r["support"] for r in self.rules]), 4) if self.rules else 0,
            "feature_count": len(self.feature_names),
            "default_class": self.default_class,
        }


# Global classifier instance
classifier = AssociativeClassifier()
