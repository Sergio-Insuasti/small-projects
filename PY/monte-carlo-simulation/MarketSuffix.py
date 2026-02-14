class MarketSuffixes:
    def __init__(self):
        self.suffixes = {
            "— Select a market —": None,
            "United States (NASDAQ / NYSE)": "",
            "Australia (ASX)": ".AX",
            "London (LSE)": ".L",
            "Toronto (TSX)": ".TO",
            "Tokyo (TSE)": ".T",
            "Germany (XETRA)": ".DE"
        }
    def getMarketSuffixes(self):
        return self.suffixes.keys()
    
    def findSuffix(self, market:str):
        return self.suffixes[market]