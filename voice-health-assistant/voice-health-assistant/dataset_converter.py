import pandas as pd
import re

# Load dataset
df = pd.read_csv("Symptom2Disease.csv")

# Rename columns
df = df.rename(columns={"label": "Disease", "text": "Symptoms"})

# Clean text
df["Symptoms"] = df["Symptoms"].str.lower()

# Extract symptoms list
symptom_list = set()

for symptoms in df["Symptoms"]:
    words = re.findall(r'\b[a-z]+\b', symptoms)
    symptom_list.update(words)

symptom_list = sorted(list(symptom_list))

# Create ML dataset
ml_dataset = []

for _, row in df.iterrows():

    symptoms_text = row["Symptoms"]

    row_data = {"Disease": row["Disease"]}

    for symptom in symptom_list:
        row_data[symptom] = 1 if symptom in symptoms_text else 0

    ml_dataset.append(row_data)

ml_df = pd.DataFrame(ml_dataset)

# Save dataset
ml_df.to_csv("ML_disease_dataset.csv", index=False)

print("Dataset created successfully")
print("Total symptoms:", len(symptom_list))