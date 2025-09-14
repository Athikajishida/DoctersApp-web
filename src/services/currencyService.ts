import axios from 'axios';

interface ExchangeRateResponse {
  rates: { [key: string]: number };
  base: string;
  date: string;
}

class CurrencyService {
  private baseUrl = 'https://api.exchangerate-api.com/v4/latest/INR';
  private cache: { [key: string]: { rate: number; timestamp: number } } = {};
  private cacheExpiry = 5 * 60 * 1000;

  async getExchangeRate(toCurrency: string): Promise<number> {
    const cacheKey = `INR_${toCurrency}`;
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate;
    }

    try {
      const response = await axios.get<ExchangeRateResponse>(this.baseUrl);
      const rate = response.data.rates[toCurrency];
      
      if (rate) {
        // Cache the result
        this.cache[cacheKey] = {
          rate,
          timestamp: Date.now()
        };
        return rate;
      } else {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      const fallbackRates: { [key: string]: number } = {
        'USD': 0.012,
        'EUR': 0.011,
        'GBP': 0.0095,
        'CAD': 0.016,
        'AUD': 0.018,
      };
      
      return fallbackRates[toCurrency] || 1;
    }
  }

  async convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'INR') {
      const rate = await this.getExchangeRate(toCurrency);
      return amount * rate;
    } else if (toCurrency === 'INR') {
      const rate = await this.getExchangeRate(fromCurrency);
      return amount / rate;
    } else {
      // Convert fromCurrency to INR first, then to toCurrency
      const toInrRate = await this.getExchangeRate(fromCurrency);
      const fromInrRate = await this.getExchangeRate(toCurrency);
      return (amount / toInrRate) * fromInrRate;
    }
  }

  // Get all available currencies with their current rates
  async getAllRates(): Promise<{ [key: string]: number }> {
    try {
      const response = await axios.get<ExchangeRateResponse>(this.baseUrl);
      return response.data.rates;
    } catch (error) {
      console.error('Failed to fetch all rates:', error);
      return {
        'USD': 0.012,
        'EUR': 0.011,
        'GBP': 0.0095,
        'CAD': 0.016,
        'AUD': 0.018,
      };
    }
  }
}

export const currencyService = new CurrencyService(); 