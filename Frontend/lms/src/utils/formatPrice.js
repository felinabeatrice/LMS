// ─────────────────────────────────────────────────────────────────
// Format price in Indian Rupees (₹)
// Uses Indian comma format: 1,00,000 (lakhs) instead of 100,000
// ─────────────────────────────────────────────────────────────────
//
// Examples:
//   formatPrice(0)       → "₹0"
//   formatPrice(499)     → "₹499"
//   formatPrice(1999)    → "₹1,999"
//   formatPrice(49999)   → "₹49,999"
//   formatPrice(100000)  → "₹1,00,000"
//
// ─────────────────────────────────────────────────────────────────
export const formatPrice = (amount) => {
  const num = parseFloat(amount);

  if (isNaN(num)) return '₹0';

  // Determine if we need decimals
  const hasDecimals = num % 1 !== 0;

  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(num);
};

export const RUPEE = '₹';