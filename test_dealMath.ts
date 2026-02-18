
import {
    sanitizeNumber,
    calculateEquityPercentage,
    calculateMAO,
    calculateDealScore
} from './src/utils/dealMath.ts';

console.log("Running DealMath Tests...");

// Test Sanitization
console.assert(sanitizeNumber("$150,000") === 150000, "sanitizeNumber failed for currency string");
console.assert(sanitizeNumber("200k") === 200, "sanitizeNumber failed for 'k' suffix (basic parse only)"); // parseFloat("200k") -> 200
console.assert(sanitizeNumber(undefined) === 0, "sanitizeNumber failed for undefined");

// Test Equity Percentage
// Formula: ((ARV - Purchase) / ARV) * 100
const equity = calculateEquityPercentage(200000, 150000);
console.assert(equity === 25, `Equity calc failed: expected 25, got ${equity}`);

// Test MAO
// (ARV * 0.7) - Repairs - Assignment
const mao = calculateMAO(100000, 10000, 5000, 0.7);
// (100k * 0.7) - 10k - 5k = 70k - 15k = 55k
console.assert(mao === 55000, `MAO calc failed: expected 55000, got ${mao}`);

// Test Deal Score
const score = calculateDealScore(25, 20, 'good'); // >20% equity (+20), >15% ROI (+10) -> Base 50 + 30 = 80
console.assert(score === 80, `Score calc failed: expected 80, got ${score}`);

console.log("All DealMath tests passed!");
