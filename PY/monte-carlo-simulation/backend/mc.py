# ================================
# Monte Carlo Portfolio Simulation
# ================================

import numpy as np
import datetime as dt
import yfinance as yf

# ================================
# Data Retrieval
# ================================

def get_data(stocks, start, end):

    stock_data = yf.download(
        stocks,
        start=start,
        end=end,
        auto_adjust=True,
        progress=False,
        threads=False
    )["Close"]

    if isinstance(stock_data, np.ndarray):
        stock_data = stock_data.to_frame()

    stock_data = stock_data.dropna(axis=1, how="all")

    if stock_data.empty:
        raise ValueError("No valid price data downloaded.")

    # Log returns
    returns = np.log(stock_data / stock_data.shift(1)).dropna()

    mean_returns = returns.mean().values
    cov_matrix = returns.cov().values

    return mean_returns, cov_matrix

# ================================
# Monte Carlo Simulation Engine
# ================================

def run_simulation(
    stocks: list,
    investment_date,
    time_horizon: int,
    num_sims: int,
    initial_investment: float
):

    end_date = dt.datetime.now()
    start_date = investment_date

    mean_returns, cov_matrix = get_data(stocks, start_date, end_date)

    num_assets = len(mean_returns)
    T = time_horizon
    mc_sims = num_sims
    init_port_value = initial_investment

    # Equal weights (cleaner for demo)
    weights = np.ones(num_assets) / num_assets

    portfolio_sims = np.zeros((T + 1, mc_sims))
    portfolio_sims[0, :] = init_port_value

    # Cholesky decomposition
    L = np.linalg.cholesky(cov_matrix)

    # Vectorized simulation (faster than looping m)
    Z = np.random.normal(size=(num_assets, T, mc_sims))
    correlated = L @ Z.reshape(num_assets, -1)
    correlated = correlated.reshape(num_assets, T, mc_sims)

    daily_returns = mean_returns[:, None, None] + correlated
    portfolio_returns = np.tensordot(weights, daily_returns, axes=1)

    cumulative = np.exp(np.cumsum(portfolio_returns, axis=0))
    portfolio_sims[1:, :] = cumulative * init_port_value

    return portfolio_sims
