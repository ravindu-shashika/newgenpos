[
  {
    id: 16880343,
    branch_id: 150,
    bill_no: 12,
    ddate: '2021-03-24',
    final_date: '2021-07-24',
    total_weight: '1.00',
    gold_value: '32000.00',
    stamp_fee_id: 3,
    redeem_amount: '25957.58',
    loan_capital: '0.00',
    customer_id: 4208408,
    bill_type_id: 23,
    interest_rate_id: 44,
    remd_letr_no: 0,
    ref_no: 307,
    prev_ref_no: 293,
    jp_note: 0,
    is_renew: 0,
    prev_bill: null,
    created_at: '2021-03-29T05:55:31.000000Z',
    updated_at: '2021-03-29T05:55:31.000000Z',
    loan_item: [
      {
        id: 18739,
        loan_id: 16880343,
        item_id: 1071,
        qty: 1,
        item_condition_id: 7,
        gold_rate_id: 28,
        gold_weight: '1.00',
        gold_value: '1.00',
        item_density: '0.00',
        ref_no: 307,
        prev_ref_no: 293,
        created_at: null,
        updated_at: null,
      },
    ],
    loan_trans: [
      {
        id: 457,
        loan_id: 16880343,
        ddate: '2021-03-24',
        trans_type_id: 1,
        amount: '25900.00',
        bill_extended_period: 4,
        ref_no: 307,
        prev_ref_no: 293,
        created_at: null,
        updated_at: null,
      },
      {
        id: 458,
        loan_id: 16880343,
        ddate: '2021-03-24',
        trans_type_id: 11,
        amount: '875.00',
        bill_extended_period: 4,
        ref_no: 307,
        prev_ref_no: 293,
        created_at: null,
        updated_at: null,
      },
      {
        id: 459,
        loan_id: 16880343,
        ddate: '2021-03-24',
        trans_type_id: 10,
        amount: '25.00',
        bill_extended_period: 4,
        ref_no: 307,
        prev_ref_no: 293,
        created_at: null,
        updated_at: null,
      },
      {
        id: 460,
        loan_id: 16880343,
        ddate: '2021-03-29',
        trans_type_id: 2,
        amount: '25957.58',
        bill_extended_period: 0,
        ref_no: 307,
        prev_ref_no: 0,
        created_at: null,
        updated_at: null,
      },
      {
        id: 461,
        loan_id: 16880343,
        ddate: '2021-03-29',
        trans_type_id: 13,
        amount: '1000.00',
        bill_extended_period: 0,
        ref_no: 307,
        prev_ref_no: 0,
        created_at: null,
        updated_at: null,
      },
      {
        id: 462,
        loan_id: 16880343,
        ddate: '2021-03-29',
        trans_type_id: 14,
        amount: '1057.58',
        bill_extended_period: 0,
        ref_no: 307,
        prev_ref_no: 0,
        created_at: null,
        updated_at: null,
      },
    ],
    customer: {
      id: 4208408,
      branch_id: 150,
      nic: '123456789',
      old_nic: null,
      name: 'MRS. M.M.FATHIMA MAZIYA',
      other_names: null,
      address_1: '160/38 BANDARANAYAKA MAWATA\nCOLOMBO 12',
      address_2: '160/38 BANDARANAYAKA MAWATA\nCOLOMBO 12',
      telephone: '0123456789',
      notes: '.',
      allowed_bills: 8,
      is_blacklisted: 0,
      created_at: '2020-08-10T23:08:04.000000Z',
      updated_at: '2021-03-24T05:31:02.000000Z',
    },
    bill_type: {
      id: 23,
      des: 'Test 12345',
      loan_period_id: 9,
      gold_rate_template_id: 8,
      int_rate_template_id: 11,
      is_active: 1,
      is_hidden: 0,
      is_gem: 0,
      user_id: 2,
      created_at: '2021-01-02T08:24:20.000000Z',
      updated_at: '2021-01-02T08:24:20.000000Z',
    },
    branch: {
      id: 150,
      code: '150',
      name: 'KAHAWATTA 2',
      address: 'NO:143, Main Street ,Kahawatta.',
      telephone: '0452271988',
      fax: '0112840391',
      email: 'deigamagroup@yahoo.com',
      grade: 'A',
      is_headoffice: 0,
      has_unique_int: 0,
      regional_office_id: 0,
      created_at: '2020-08-05T23:00:03.000000Z',
      updated_at: '2020-08-05T23:00:03.000000Z',
    },
  },
];

//////////////////////////////////////////////

const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a5',
});
doc.setFontSize(12);
doc.setFont('times', 'normal', 'normal');

doc.text(`${billData[0].branch.name}`, 178, 20);
doc.text(moment(billData[0].created_at).format(`HH:MM`), 200, 30);
doc.text(`${billData[0].id}`, 200, 37);

doc.text(moment(billData[0].created_at).format(`YYYY-MM-DD`), 10, 48);
doc.text(`${billData[0].bill_type.des} | ${billData[0].bill_no}`, 63, 48);

doc.text(`${billData[0].customer.name}`, 14, 64);
doc.text(`${billData[0].customer.address_1}`, 14, 69);
doc.text(`${billData[0].customer.nic}`, 14, 94);
doc.text(`${billData[0].customer.telephone}`, 77, 94);

doc.text(`${billData[0].loan_capital}`, 37, 107);
doc.text(`${billData[0].bill_type.period.des}`, 112, 107);
doc.text(`${billData[0].final_date}`, 195, 107);

doc.text(amountInWords, 35, 117);

if (billData[0].is_renew) {
  doc.setFont('times', 'italic', 'normal');
  doc.text(`RENEWD BILL`, 130, 48);
  doc.setFont('times', 'normal', 'normal');
  doc.text(`Previous bill - ${billData[0].prev_bill}`, 130, 52);
}

////////////////////////////////////////////////

const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a5',
});
doc.setFontSize(12);
doc.setFont('times', 'normal', 'normal');

doc.text(`${billData[0].branch.name}`, 165, 20);
doc.text(moment(billData[0].created_at).format(`HH:MM`), 187, 27);
doc.text(`${billData[0].id}`, 187, 34);

doc.text(moment(billData[0].created_at).format(`YYYY-MM-DD`), 7, 45);
doc.text(`${billData[0].bill_type.des} | ${billData[0].bill_no}`, 55, 45);

doc.text(`${billData[0].customer.name}`, 10, 60);
doc.text(`${billData[0].customer.address_1}`, 10, 65);
doc.text(`${billData[0].customer.nic}`, 10, 90);
doc.text(`${billData[0].customer.telephone}`, 70, 90);

doc.text(`${billData[0].loan_capital}`, 7, 105);
doc.text(`${billData[0].bill_type.period.des}`, 105, 100);
doc.text(`${billData[0].final_date}`, 180, 100);

doc.text(amountInWords, 30, 112);

if (billData[0].is_renew) {
  doc.setFont('times', 'italic', 'normal');
  doc.text(`RENEWD BILL`, 120, 41);
  doc.setFont('times', 'normal', 'normal');
  doc.text(`Previous bill - ${billData[0].prev_bill}`, 120, 45);
}
