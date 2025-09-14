import pandas as pd
import numpy as np
from scipy import stats

# Input files (relative paths are fine if you run from this folder)
c = './moved_same_state.csv'
v = './moved_between_states.csv'

control = pd.read_csv(c)
variant = pd.read_csv(v)

# Prepare empty holders (optional)
county = pd.DataFrame()
state = pd.DataFrame()
division = pd.DataFrame()
region = pd.DataFrame()

# ---------------------------
# 1) State-level totals table
# ---------------------------
# Use join so the index (State) lines up across both sources
state = (
    control.groupby("State")["Total Population"].sum().to_frame("Relocated Within State")
    .join(
        variant.groupby("State")["Total Population"].sum().to_frame("Relocated Between States"),
        how="outer"
    )
    .fillna(0)
)

# California vs New York (within vs between)
california_to_new_york = state.loc[["California", "New York"]]

# Welch t-test is usually safer; set equal_var=False. If you want classic Student t-test, set True.
t_stat, p_value = stats.ttest_ind(
    california_to_new_york["Relocated Within State"],
    california_to_new_york["Relocated Between States"],
    equal_var=False
)
print("CA/NY – Within vs Between")
print("t-statistic:", t_stat)
print("p-value:", p_value)

# -------------------------------------------------------------------
# 2) Fix: DON'T mix boolean masks from different DataFrames together.
#    Build the two-state set by concatenating slices from each source.
# -------------------------------------------------------------------
d = pd.concat(
    [
        control[control["State"] == "California"],   # within-state movements for CA
        variant[variant["State"] == "New York"],     # between-state movements for NY
    ],
    ignore_index=True
)

# Exact column names in your CSVs use "U.S." (with periods)
NAT_COL = "Total U.S. Citizens (Naturalized)"
NON_COL = "Total Non-Citizens"
NATIVE_COL = "Total U.S. Citizens (Native)"
HS_COL = "High School Graduate (or its Equivalency)"
BA_COL = "Bachelor's Degree"

# ------------------------------------------------------------
# 3) CA (within) + NY (between): Naturalized vs Non-Citizens
# ------------------------------------------------------------
cny2 = d.groupby("State").agg({NAT_COL: "sum", NON_COL: "sum"}).rename(columns={
    NAT_COL: "US Citizens (Naturalized)",
    NON_COL: "Non-Citizens",
})
t_stat, p_value = stats.ttest_ind(
    cny2["US Citizens (Naturalized)"],
    cny2["Non-Citizens"],
    equal_var=False
)
print("\nCA(within)+NY(between) – Naturalized vs Non-Citizens")
print("t-statistic:", t_stat)
print("p-value:", p_value)

# ------------------------------------------------------------
# 4) CA (within) + NY (between): Native vs Naturalized Citizens
# ------------------------------------------------------------
cny3 = d.groupby("State").agg({NATIVE_COL: "sum", NAT_COL: "sum"}).rename(columns={
    NATIVE_COL: "US Citizens (Native)",
    NAT_COL: "US Citizens (Naturalized)",
})
t_stat, p_value = stats.ttest_ind(
    cny3["US Citizens (Native)"],
    cny3["US Citizens (Naturalized)"],
    equal_var=False
)
print("\nCA(within)+NY(between) – Native vs Naturalized")
print("t-statistic:", t_stat)
print("p-value:", p_value)

# ---------------------------------------------
# 5) Regions: HS Grad vs Bachelor's (NE + South)
# ---------------------------------------------
region = control.groupby("Region").agg({HS_COL: "sum", BA_COL: "sum"})
nem = region.loc[region.index.isin(["Northeast", "South"])]
t_stat, p_value = stats.ttest_ind(nem[HS_COL], nem[BA_COL], equal_var=False)
print("\nRegions (NE + South) – HS vs Bachelor's")
print("t-statistic:", t_stat)
print("p-value:", p_value)

# --------------------------------------------------------
# 6) Divisions: Never Married vs Married (SA + Mountain)
# --------------------------------------------------------
division = control.groupby("Division").agg({"Never Married": "sum", "Married": "sum"})
sam = division.loc[division.index.isin(["South Atlantic", "Mountain"])]
t_stat, p_value = stats.ttest_ind(sam["Never Married"], sam["Married"], equal_var=False)
print("\nDivisions (South Atlantic + Mountain) – Never Married vs Married")
print("t-statistic:", t_stat)
print("p-value:", p_value)
