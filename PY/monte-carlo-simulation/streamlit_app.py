import streamlit as st
import plotly.graph_objects as go
import datetime as dt

from backend.mc import run_simulation
from state import initialise
from portfolio_setup import setup_portfolio

# ================================
# Market Mapping
# ================================

initialise()
st.title("Monte Carlo Portfolio Simulator")
st.subheader("Build Portfolio")

setup_portfolio()

# ================================
# Portfolio + Simulation Settings
# ================================

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("You've chosen:")
    st.write(f"{st.session_state.portfolio}")

    if st.button("Clear"):
        st.session_state.portfolio = []

with col2:
    st.subheader("Simulation Settings")

    investment_date = st.date_input(
        "Investment Start Date",
        value=dt.date.today() - dt.timedelta(days=300)
    )

    time_horizon = st.slider(
        "Time Horizon (days)",
        min_value=10,
        max_value=365,
        value=100
    )

    num_sims = st.slider(
        "Number of Simulations",
        min_value=10,
        max_value=2000,
        value=500,
        step=10
    )

    initial_investment = st.number_input(
        "Initial Investment",
        min_value=1000,
        max_value=1000000,
        value=10000,
        step=1000
    )

    if st.button("Create Simulation"):

        if not st.session_state.portfolio:
            st.error("Please add at least one stock.")
            st.stop()

        sims = run_simulation(
            stocks=st.session_state.portfolio,
            investment_date=dt.datetime.combine(
                investment_date, dt.datetime.min.time()
            ),
            time_horizon=time_horizon,
            num_sims=num_sims,
            initial_investment=initial_investment
        )

        st.session_state.sims = sims
        st.session_state.time_horizon = time_horizon

st.divider()

if st.session_state.sims is not None:

    st.subheader("Simulation Results")

    sims = st.session_state.sims
    T = st.session_state.time_horizon

    max_lines = min(sims.shape[1], 500)

    fig = go.Figure()

    for i in range(max_lines):
        fig.add_trace(
            go.Scatter(
                x=list(range(T + 1)),
                y=sims[:, i],
                mode="lines",
                line=dict(width=1),
                opacity=0.6,
                hoverinfo="x+y",
                name=f"Sim {i+1}",
                showlegend=False
            )
        )

    fig.update_layout(
        title="Monte Carlo Portfolio Simulation",
        xaxis_title="Days",
        yaxis_title="Portfolio Value",
        template="plotly_dark",
        hovermode="closest",
        height=600
    )

    st.plotly_chart(fig, use_container_width=True)

