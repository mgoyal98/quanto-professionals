/**
 * Convert a number to words in Indian format with Rupees and Paise
 * e.g., 12345.67 -> "Twelve Thousand Three Hundred Forty Five Rupees and Sixty Seven Paise Only"
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertTwoDigits(num: number): string {
  if (num < 20) {
    return ones[num];
  }
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
}

function convertThreeDigits(num: number): string {
  if (num === 0) return '';

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  let result = '';
  if (hundred > 0) {
    result = ones[hundred] + ' Hundred';
    if (remainder > 0) {
      result += ' ';
    }
  }

  if (remainder > 0) {
    result += convertTwoDigits(remainder);
  }

  return result;
}

/**
 * Convert a whole number to words using Indian numbering system
 * (Lakhs and Crores instead of Millions and Billions)
 */
function convertWholeNumber(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + convertWholeNumber(-num);

  let result = '';
  let n = Math.floor(num);

  // Crores (1,00,00,000)
  if (n >= 10000000) {
    const crores = Math.floor(n / 10000000);
    result += convertThreeDigits(crores) + ' Crore ';
    n %= 10000000;
  }

  // Lakhs (1,00,000)
  if (n >= 100000) {
    const lakhs = Math.floor(n / 100000);
    result += convertTwoDigits(lakhs) + ' Lakh ';
    n %= 100000;
  }

  // Thousands (1,000)
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    result += convertTwoDigits(thousands) + ' Thousand ';
    n %= 1000;
  }

  // Hundreds (100)
  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    result += ones[hundreds] + ' Hundred ';
    n %= 100;
  }

  // Tens and ones
  if (n > 0) {
    result += convertTwoDigits(n);
  }

  return result.trim();
}

/**
 * Convert a number to Indian Rupee words
 * @param amount - The amount to convert
 * @returns The amount in words (e.g., "Twelve Thousand Three Hundred Forty Five Rupees and Sixty Seven Paise Only")
 */
export function numberToWordsIndian(amount: number): string {
  if (amount === 0) {
    return 'Zero Rupees Only';
  }

  // Separate rupees and paise
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  let result = '';

  // Handle negative amounts
  if (amount < 0) {
    result = 'Minus ';
  }

  // Convert rupees
  if (rupees > 0) {
    result += convertWholeNumber(rupees);
    result += rupees === 1 ? ' Rupee' : ' Rupees';
  }

  // Convert paise
  if (paise > 0) {
    if (rupees > 0) {
      result += ' and ';
    }
    result += convertTwoDigits(paise);
    result += paise === 1 ? ' Paisa' : ' Paise';
  }

  result += ' Only';

  return result;
}

/**
 * Convert a number to words (generic, non-currency)
 * @param num - The number to convert
 * @returns The number in words
 */
export function numberToWords(num: number): string {
  return convertWholeNumber(num);
}

