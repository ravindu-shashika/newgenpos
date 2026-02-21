import api from './api';
export default {
  async calculatePayableAmount(loan_amount, stamp_fees, interest_rates) {
    // const interest_rate_template = await api.get(`interest-rate-template-id/${bill_type_id}`);
    // const interest_rate = await api.get(`interest-rate-details-for-interest-calculation/${interest_rate_template.data.data.int_rate_template_id}/${loan_amount}`)
    // const stamp_fees = await api.get(`stamps-fee-id/${loan_amount}`)
    console.log('vackward cal mode' + loan_amount);
    let stamp_fee = 0;
    let stamp_fee_id = 0;
    let interest_rate_id = 0;
    let first_month_interest_rate = 0;
    let next_month_interest_rate = 0;
    let first_month_interest = 0;
    let next_month_interest = 0;
    let required_amount_original = 0;
    let required_amount_round_up = 0;
    stamp_fees.map((stampFee) => {
      if (
        parseFloat(stampFee.from_value) <= parseFloat(loan_amount) &&
        parseFloat(loan_amount) <= parseFloat(stampFee.to_value)
      ) {
        stamp_fee = parseFloat(stampFee.stamp_fee);
        stamp_fee_id = stampFee.id;
      }
    });
    interest_rates.map((rates) => {
      if (
        parseFloat(rates.from_amount) <= parseFloat(loan_amount) &&
        parseFloat(loan_amount) <= parseFloat(rates.to_amount)
      ) {
        first_month_interest_rate = parseFloat(rates.fm_interest_rate);
        next_month_interest_rate = parseFloat(rates.nm_interest_rate);
        interest_rate_id = rates.id;
      }
    });
    first_month_interest =
      parseFloat(
        parseFloat(loan_amount) * parseFloat(first_month_interest_rate),
      ) / 100;
    next_month_interest =
      parseFloat(
        parseFloat(loan_amount) * parseFloat(next_month_interest_rate),
      ) / 100;
    required_amount_original =
      parseFloat(loan_amount) -
      parseFloat(parseFloat(stamp_fee) + parseFloat(first_month_interest));
    required_amount_round_up = Math.floor(required_amount_original / 5) * 5;
    return {
      interest_rate_id: interest_rate_id,
      first_month_interest_rate: first_month_interest_rate,
      first_month_interest: first_month_interest,
      next_month_interest_rate: next_month_interest_rate,
      next_month_interest: next_month_interest,
      stamp_fee_id: stamp_fee_id,
      stamp_fee: stamp_fee,
      required_amount_original: required_amount_original,
      required_amount_round_up: required_amount_round_up,
    };
  },
};
