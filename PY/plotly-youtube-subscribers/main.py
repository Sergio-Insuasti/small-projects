# Processes data about the top 1000 YouTube channels
# Rows are: rank, youtuber, subscribers, video views, video count, category, started

import pandas as pd
import plotly.express as px

df = pd.read_csv("./most_subscribed_youtube_channels.csv")

# Remove all , 
df = df.replace(',', '', regex=True)
print(df.head)  

# Create histogram
fig = px.histogram(df, x='subscribers', title='Subscriber Count')
# fig.show()

# Create Pie Chart
fig = px.pie(df, values='subscribers', names='category', title='Youtube Categories')
# fig.show()

# Create Boxplot
fig = px.box(df, y='started', title='Years Started')
fig.show()