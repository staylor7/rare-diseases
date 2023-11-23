import pandas as pd

# Load the CSV file
df = pd.read_csv('seq.d3.csv')

# Add an index column
df['index'] = range(1, len(df) + 1)

# Save the modified CSV
df.to_csv('seq.d3.csv', index=False)
