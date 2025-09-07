# Basic intro file using basic pandas operations
# Dataset - bestsellers.csv: contains data about
# the 50 best selling books on Amazon (2009-2019)

# Columns:
#   Name, Author, User Rating, Reviews, Price, Year, Genre

import pandas as pd

df = pd.read_csv("./bestsellers.csv")

# Get the first 5 rows of the spreadsheet
print(df.head())

# Get the shape of the spreadsheet
print(df.shape)

# Get the column names of the spreadsheet
print(" ".join(df.columns))

# Get summary statistics of each column
print(df.describe())

# Remove any unnecessary duplicates
df.drop_duplicates(inplace=True)

# Rename columns to more context-appropriate names
df.rename(columns={"Name": "Title", "Year": "Publication Year", "User Rating": "Rating"}, inplace=True)
print(df.head())

# Convert data type of price to a float
df["Price"] = df["Price"].astype(float)

# Analyse which authors have the most books
author_counts = df["Author"].value_counts()
print(author_counts)

# Find the average rating by Genre
avg_rating_by_genre = df.groupby("Genre")["Rating"].mean()
print(avg_rating_by_genre)

# Export results
author_counts.head(10).to_csv("top_authors.csv")

avg_rating_by_genre.to_csv("avg_rating_by_genre.csv")