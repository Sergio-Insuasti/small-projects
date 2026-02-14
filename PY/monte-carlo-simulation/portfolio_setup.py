import streamlit as st
import yfinance as yf

from state import (
    getState,
    getPortfolio,
    addTicker,
    removeRecentTicker)

from MarketSuffix import MarketSuffixes

def setup_portfolio():
    
    marketSuffixes = MarketSuffixes()

    market = st.selectbox(
        "Select Market *",
        options=list(marketSuffixes.getMarketSuffixes()),
        index=0
    )

    col1, col2 = st.columns([3, 1])

    with col1:
        stock_search = st.text_input("Search Stock (e.g. AAPL, AMZN, NVDA)")

    with col2:
        if st.button("Add Stock"):
            ticker = stock_search.strip().upper()
            suffix = marketSuffixes.findSuffix(market)

            if not ticker:
                st.error("Please enter a ticker.")
                st.stop()

            if suffix is None:
                st.error("Please select a market.")
                st.stop()

            symbol = ticker + suffix

            t = yf.Ticker(symbol)
            if t.history(period="1d").empty:
                st.error("Ticker not found for selected market.")
                st.stop()

            if symbol not in getPortfolio():
                addTicker(symbol=symbol)

        if st.button("Undo"):
            if getState().portfolio:
                removeRecentTicker()