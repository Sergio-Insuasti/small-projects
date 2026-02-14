import streamlit as st
    
def initialise():
    if "portfolio" not in st.session_state:
        st.session_state.portfolio = []

    if "sims" not in st.session_state:
        st.session_state.sims = None

    if "time_horizon" not in st.session_state:
        st.session_state.time_horizon = None
        
def getState():
    return st.session_state

def getPortfolio():
    return st.session_state.portfolio

def addTicker(symbol: str):
    st.session_state.portfolio.append(symbol)

def removeRecentTicker():
    st.session_state.portfolio.pop()