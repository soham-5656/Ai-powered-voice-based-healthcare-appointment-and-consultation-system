import pandas as pd

# Load original dataset
df = pd.read_csv("Symptom2Disease.csv")

# Convert columns
new_df = pd.DataFrame({
    "Disease": df["label"],
    "Symptoms": df["text"]
})

# Save new dataset
new_df.to_csv("disease_symptoms_dataset.csv", index=False)

print("Dataset converted successfully!")