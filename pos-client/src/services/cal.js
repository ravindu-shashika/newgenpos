import { roundup } from '.';

export default {
  async calPaidAmounts(trans) {
    let paidCapital = 0;
    let paidInterest = 0;
    let part_payment_ref_number = [];
    return Promise.all(
      trans.map((row) => {
        if (row.trans_type_id === 8) {
          paidCapital += parseFloat(row.amount);
        }
        // if (row.trans_type_id === 7 || row.trans_type_id === 11) {
        //     paidInterest += parseFloat(row.amount);
        // }
        if (
          row.trans_type_id === 7 ||
          row.trans_type_id === 11 ||
          row.trans_type_id === 23
        ) {
          if (row.trans_type_id === 7) {
            part_payment_ref_number.push(row.ref_no);
          }
          if (row.trans_type_id === 23) {
            if (part_payment_ref_number.includes(row.ref_no)) {
              paidInterest += parseFloat(row.amount);
            }
          } else {
            paidInterest += parseFloat(row.amount);
          }
        }
      }),
    ).then(() => {
      return {
        paidCapital: paidCapital,
        paidInterest: paidInterest,
      };
    });
  },

  async calTotalInterest(
    required_amount,
    payableAmount,
    intRates,
    months,
    days,
    nmDays,
    bill_type,
    additional,
    stamp_fee,
  ) {
    var requiredAmount = parseFloat(required_amount);
    let fmInt =
      parseFloat(
        parseFloat(requiredAmount) * parseFloat(intRates.fm_interest_rate),
      ) / 100;
    let nmInt =
      parseFloat(
        parseFloat(requiredAmount) * parseFloat(intRates.nm_interest_rate),
      ) / 100;
    let totInt = 0;

    if (months == -1) {
      return Promise.all([(totInt = parseFloat(fmInt))]).then(() => {
        return totInt;
      });
    } else {
      if (nmDays <= parseInt(bill_type.grace_period)) {
        return Promise.all([
          (totInt = parseFloat(
            parseFloat(fmInt) +
              parseFloat(parseFloat(nmInt) * parseInt(months)) +
              parseFloat(
                parseFloat(parseFloat(nmInt) * parseInt(nmDays)) /
                  parseFloat(parseFloat(30)),
              ),
          )),
        ]).then(() => {
          console.log('totInt' + totInt);
          console.log('fmint-' + parseFloat(fmInt));
          console.log('nmint-' + parseFloat(nmInt));
          console.log('month' + parseInt(months));
          console.log('nmday' + parseInt(nmDays));

          return totInt;
        });
      } else {
        return Promise.all([
          (totInt = parseFloat(
            parseFloat(fmInt) +
              parseFloat(parseFloat(nmInt) * parseInt(months)),
          ).toFixed(4)),
        ]).then(() => {
          console.log('totInt' + totInt);
          return totInt;
        });
      }
    }
  },

  async calDiscount(
    requiredAmount,
    payableAmount,
    discountRates,
    totInt,
    months,
    days,
    nmDays,
  ) {
    let discount = 0;
    if (!Array.isArray(discountRates)) {
      return Promise.all([
        (discount = parseFloat(
          (parseFloat(requiredAmount) * parseFloat(discountRates.rate)) / 100,
        ).toFixed(2)),
      ]).then(() => {
        return discount;
      });
    } else {
      return Promise.all([(discount = (0).toFixed(2))]).then(() => {
        return discount;
      });
    }
  },
};
