/**
 * Black-76 option pricing model for commodity futures/forwards.
 * Reference implementation — not for production risk.
 */

// Standard normal CDF approximation (Abramowitz & Stegun)
function normCdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + p * Math.abs(x));
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1.0 + sign * y);
}

// Standard normal PDF
function normPdf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

export interface Black76Input {
  F: number;       // Forward/futures price
  K: number;       // Strike
  T: number;       // Time to expiry in years
  sigma: number;   // Volatility (decimal, e.g. 0.30 for 30%)
  r: number;       // Risk-free rate (decimal)
  isCall: boolean;
}

export interface Black76Output {
  premium: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export function black76(input: Black76Input): Black76Output {
  const { F, K, T, sigma, r, isCall } = input;

  if (T <= 0 || sigma <= 0 || K <= 0 || F <= 0) {
    return { premium: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(F / K) + (sigma * sigma / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const df = Math.exp(-r * T); // discount factor

  let premium: number;
  let delta: number;
  let rho: number;

  if (isCall) {
    premium = df * (F * normCdf(d1) - K * normCdf(d2));
    delta = df * normCdf(d1);
    rho = T * premium;
  } else {
    premium = df * (K * normCdf(-d2) - F * normCdf(-d1));
    delta = -df * normCdf(-d1);
    rho = -T * premium;
  }

  const gamma = df * normPdf(d1) / (F * sigma * sqrtT);
  const vega = F * df * normPdf(d1) * sqrtT / 100; // per 1% vol move
  const theta = -(F * df * normPdf(d1) * sigma) / (2 * sqrtT) / 365; // per day

  return { premium, delta, gamma, vega, theta, rho };
}
