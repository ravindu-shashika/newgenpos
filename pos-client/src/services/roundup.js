/**
 * This does the weird amount roundups of the  amounts.
 * Pass the @param amount needs to be rounded up.
 * If you need a new type of a roundup feel free to write your own method
 */

export default {
  async pawning(amount) {
    // prettier-ignore
    return parseFloat(Math.ceil(parseFloat(amount) / 5) * 5).toFixed(2);
    // prettier-ignore-end
  },

  async redeem(amount) {
    // prettier-ignore
    if (
      parseFloat(amount) % 10 <= 1 || (parseFloat(amount) % 10 >= 5 && parseFloat(amount) % 10 <= 6)
    ) {
      return parseFloat(Math.floor(parseFloat(amount) / 5) * 5).toFixed(2);
    } else {
      return parseFloat(Math.ceil(parseFloat(amount) / 5) * 5).toFixed(2);
    }
    // prettier-ignore-end
  },
};
