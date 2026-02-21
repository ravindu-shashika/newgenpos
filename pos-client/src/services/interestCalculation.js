export default {
    async finalInterest(loanAmount, interestRate, stampFee, otherInterest) {

        // * return values
        let required_amount = 0
        let roundup_amount = 0
        let final_int = 0
        let other_month_int = 0

        //  * initialize variables
        let loan_amount = parseFloat(loanAmount)
        let interest_rate = parseFloat(interestRate)
        let stamp_fee = parseFloat(stampFee)
        let other_interest = parseFloat(otherInterest)

        // * inverse intrest rate = (100 - interest_rate)
        let inverse_instrest_rate = parseFloat(100 - interest_rate)

        // * mu rate
        let mu_rate = parseFloat(interest_rate / inverse_instrest_rate * 100)

        // * real rate
        let real_rate = parseFloat(loan_amount * mu_rate / 100)

        // * stamp fee int
        let stamp_fee_int = parseFloat(stamp_fee * interest_rate / 100)

        let requred_amount = parseFloat(loan_amount + real_rate + stamp_fee + stamp_fee_int)

        let roundup_required_amount = parseFloat(Math.ceil(parseFloat(requred_amount) / 5) * 5).toFixed(2);

        let final_interest = parseFloat(roundup_required_amount * interest_rate / 100)

        let next_month_int = parseFloat(roundup_required_amount * other_interest / 100)

        return Promise.all(
        [
            required_amount = requred_amount,
            roundup_amount = roundup_required_amount,
            final_int = final_interest, 
            other_month_int = next_month_int
        ]
        ).then(() => {
            return {
                required_amount: required_amount,
                roundup_amount: roundup_amount,
                final_int: final_int, 
                other_month_int: other_month_int
            }
        })
    }
}