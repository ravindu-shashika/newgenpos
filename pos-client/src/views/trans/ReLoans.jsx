import React, { useState, useEffect, useRef } from 'react';
import { api, cookie, msg, print, roundup } from '../../services';
// import 'primeicons/primeicons.css';

import interestCalculator from '../../services/interestCalculation';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import moment from 'moment';

import {
  SystemButton,
  UnclosableModal,
  FormModal,
  Alert,
  Loader,
} from '../../components';
import { v4 as uuidv4 } from 'uuid';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { useParams, useNavigate } from 'react-router-dom';
import { SafeFontAwesomeIcon } from '../../components';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
// // import { async } from 'exceljs/dist/exceljs';
import backwordCalculation from '../../services/backwordCalculation';

/**
 * TODO : Declare one state to hold all states for showing and hiding sections and declare each in that state (like done in the loading states)
 */

const ReLoans = () => {
  // Module name
  const moduleName = 'Re Pawning';

  /* --- State declarationss --- */
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    branch_id: cookie.get('user_branch'),
    nic: '',
    old_nic: '',
    id: '',
    title: '',
    name: '',
    other_names: '',
    address_1: '',
    address_2: '',
    telephone: '',
    telephone_2: '',
    notes: '',
    allowed_bills: '',
    is_blacklisted: false,
  });

  const [draftRenewBillDetails, setDraftRenewBillDetails] = useState({
    loan_id: 0,
    branch_id: 0,
    bill_type_id: 0,
    bill_no: 0,
  });

  const [cancelOldBill, setCancelOldBill] = useState(false);

  const [enbleChangeCustomer, setEnablechangeCustomer] = useState(false);

  const [
    allowChangeBillTypeWithoutChangeItems,
    setAllowChangeBillTypeWithoutChangeItems,
  ] = useState(false);

  const [cancelBillId, setCancelBillId] = useState(0);

  const [isCancelBill, setIsCancelBill] = useState(false);

  const [allowEditItems, setAllowEditItems] = useState(true);

  const [isRenewalPawning, setIsRenewalPawning] = useState(false);

  const [nicChanged, setNicChanged] = useState(false);

  const [isEdit, setIsEdit] = useState(false);

  const [customerNic, setCustomerNic] = useState('');

  const [disableSendApproveButton, setDisableSendApproveButton] =
    useState(false);

  const [disableSendApproveButtonCust, setDisableSendApproveButtonCust] =
    useState(false);

  const [billTypeSearch, setBillTypeSearch] = useState({
    bill_type_id: '',
    bill_type_name: '',
    bill_no: '',
  });

  const [permission, setPermission] = useState({
    old_bill_disable: true,
  });

  const [loadBillTypeForApproval, setloadBillTypeForApproval] = useState({
    bill_type_id: '',
    bill_type_name: '',
    bill_no: '',
  });

  const [disabledSaveBtn, setDisabledSaveBtn] = useState(false);

  const [disabledUpdateBtn, setDisabledUpdateBtn] = useState(false);

  const [loanHistory, setLoanHistory] = useState({
    loans: [],
    loanItems: [],
    redeems: [],
    others: [],
    pawning_count: 0,
    redeem_count: 0,
    other_count: 0,
    redeemed_total: 0,
    pawning_total: 0,
  });

  const [disableFields, setDisablenic] = useState(false);

  const [itemCategories, setItemCategories] = useState([]);

  const [itemConditions, setItemConditions] = useState([]);

  const [goldRates, setGoldRates] = useState([]);

  const [approvalRefNo, setApprovalRefNo] = useState('');

  const [billTypes, setBillTypes] = useState([]);
  const [nameTitles, setNameTitles] = useState(['MR.', 'MRS.', 'MISS.', 'MS.']);

  const [stampFees, setStampFees] = useState([]);

  const [interestRates, setInterestRates] = useState([]);

  const [approvelNummber, setApprovelNumber] = useState('');

  const [newLoan, setNewLoan] = useState({
    branch_id: cookie.get('user_branch'),
    // ddate: moment().format(`YYYY-MM-DD`),
    ddate: cookie.get('new_date')
      ? cookie.get('new_date')
      : moment().format(`YYYY-MM-DD`),
    final_date: '',
    total_weight: (0).toFixed(2),
    gold_value: (0).toFixed(2),
    required_amount: (0).toFixed(2),
    service_charge: '',
    payable_amount: '',
    customer_id: '',
    bill_type_id: '',
    bill_count: '',
    interest_rate_id: '',
    stamp_fee_id: '',
    remd_letr_no: '0',
    is_renew: false,
    is_old_bill: false,
    prev_bill_type: '',
    prev_bill_no: '',
    user: cookie.get('user_id'),
    status: 'PENDING',
    approval_remarks: '',
    approving_officer: '',
    ref_no: '',
    created_at: moment().format(`YYYY-MM-DD | HH:MM`),
    updated_at: moment().format(`YYYY-MM-DD | HH:MM`),
    additional_fees: (0).toFixed(2),
    operation: 'plus',
    stat: '',
    is_draft: false,
    draft_bill_details: [],
    calculation_mode: 'FORWARD',
    prev_ref_no: '',
    old_bill_type_id: '',
    old_bill_no: '',
  });

  const [isManualBillNo, setIsManualBillNo] = useState(false);

  const [isRedeemBillRenew, setIsRedeemBillRenew] = useState(false);

  const [pawningItems, setPawningItems] = useState([]);

  const [transactionData, setTransactionData] = useState([]);

  const [isOldPawning, setIsOldPawning] = useState(false);

  const [isExistingCustomer, setIsExistingCustomer] = useState('not-loaded');

  const [officers, setOfficers] = useState([]);

  const [calculationMode, setCalculationMode] = useState('FORWARD');

  const [dencimeters, setDencimeters] = useState([
    24, 22, 21, 20, 18, 16, 14, 10, 9, 0,
  ]);

  const [additionalPawnData, setAdditionalPawnData] = useState({
    duration: '',
    months: 0,
    fm_interest_rate: (0).toFixed(2),
    nm_interest_rate: (0).toFixed(2),
    first_month_interest: (0).toFixed(2),
    next_month_interest: (0).toFixed(2),
    stamp_fee: (0).toFixed(2),
    maxPrevBillNum: 0,
    refNo: '',
    isRedeemed: false,
    operation: 'plus',
    ref_no: '',
  });

  const [isLoading, setIsLoading] = useState({
    init: false,
    customer: false,
    items: false,
    history: false,
    billCount: false,
    newBillno: false,
  });

  const [showSectionStates, setShowSectionStates] = useState({
    customerSection: true,
    itemSection: false,
    transHistorySection: true,
    timerModal: false,
    timerModalCusLimit: false,
    historyModal: false,
    historyModalType: 'items',
    quickRenewModal: false,
    oldPawningItems: false,
    approvalConfirmation: false,
    approvalConfirmationcuslimit: false,
    toggleCancelBills: false,
    toggleRenewDraftBills: false,
  });

  const [renewData, setRenewData] = useState({
    branch_id: cookie.get('user_branch'),
    oldLoanId: '',
    newBillTypeId: '',
    newBillno: '',
    newAmount: '',
    newPawningDate: moment().format(`YYYY-MM-DD`),
  });

  const [additionalRenewData, setAdditionalRenewData] = useState({
    newDuration: '',
    newMonths: '',
    newFinalDate: '',
    newGoldRates: [],
    newInterestrates: [],
  });

  const accept = () => {};

  const reject = () => {};

  const [controlDisabledStates, setControlDisabledStates] = useState({
    customer: {
      nic: false,
      title: true,
      oldNic: true,
      name: true,
      otherName: true,
      postalAddress: true,
      nicAddress: true,
      telephone: true,
      telephone_2: true,
      notes: true,
      collapse: true,
    },
    billType: {
      billType: false,
      billNo: false,
      pawningDate: false,
    },
    items: {
      category: false,
      item: false,
      condition: false,
      condition_note: false,
      type: false,
      densimeter: false,
      count: false,
      weight: false,
      removeItem: false,
      addItems: false,
      collapse: true,
    },
    loan: {
      payableAmount: false,
      requiredAmount: false,
      isRenewal: false,
      renewalBillNo: false,
      // isOldBill: false,
    },
    saveButton: true,
  });

  const [cancelBills, setCancelBills] = useState([]);

  const [renewDraftBills, setRenewDraftBills] = useState([]);

  /* --- End of state declarations --- */

  /* --- Reference declarations --- */

  const dataSection = useRef(null);

  const cusNameControl = useRef(null);

  const itemQtyControl = useRef(null);

  const { branch_id, bill_type_id, bill_no, bill_type } = useParams();
  const paramsn = useParams();

  const [loadNewBill, setLoadNewBill] = useState(false);

  // console.log('fdf');
  // console.log(paramsn);

  useEffect(() => {
    if (
      branch_id != ':branch_id' &&
      bill_type_id != ':bill_type_id' &&
      bill_no != ':bill_type' &&
      bill_type != ':bill'
    ) {
      // fetchData();

      console.log('pending' + bill_type);

      loadBillForReNew(branch_id, bill_type_id, bill_no, bill_type, 'load');
    } else {
      fetchData();
    }
  }, []);

  useEffect(() => {
    console.log('status when change calculation mode : ' + loadNewBill);
    if (loadNewBill != true) {
      setAdditionalPawnData({
        ...additionalPawnData,
        fm_interest_rate: (0).toFixed(2),
        nm_interest_rate: (0).toFixed(2),
        first_month_interest: (0).toFixed(2),
        next_month_interest: (0).toFixed(2),
        stamp_fee: (0).toFixed(2),
      });
      setNewLoan({
        ...newLoan,
        payable_amount: (0).toFixed(2),
        required_amount: (0).toFixed(2),
        calculation_mode: calculationMode,
      });
    }
    // }, [newLoan.calculation_mode]);
  }, [calculationMode]);

  useEffect(() => {
    if (nicChanged) {
      setControlDisabledStates({
        ...controlDisabledStates,
        customer: {
          nic: true,
          title: false,
          oldNic: false,
          name: false,
          otherName: false,
          postalAddress: false,
          nicAddress: false,
          telephone: false,
          notes: false,
          collapse: false,
        },
      });
    }
  }, [nicChanged]);

  useEffect(() => {
    if (
      additionalPawnData.isRedeemed ||
      (isOldPawning && !cookie.get('permissions').update_loan) ||
      customer.is_blacklisted
    ) {
      setControlDisabledStates({
        ...controlDisabledStates,
        billType: {
          billType: true,
          billNo: true,
          pawningDate: true,
        },
        items: {
          category: true,
          item: true,
          condition: true,
          condition_note: true,
          type: true,
          densimeter: true,
          count: true,
          weight: true,
          removeItem: true,
          addItems: true,
          collapse: false,
        },
        loan: {
          payableAmount: true,
          requiredAmount: true,
          isRenewal: true,
          renewalBillNo: true,
          //  isOldBill: true,
        },
      });
    }
  }, [additionalPawnData.isRedeemed, isOldPawning, customer.is_blacklisted]);

  useEffect(() => {
    if (isExistingCustomer === 'new') {
      setControlDisabledStates({
        ...controlDisabledStates,
        customer: {
          nic: false,
          title: false,
          oldNic: false,
          name: false,
          otherName: false,
          postalAddress: false,
          nicAddress: false,
          telephone: false,
          telephone_2: false,
          notes: false,
          collapse: false,
        },
      });
    }

    if (isOldPawning) {
      if (cookie.get('permissions').full_edit_customer) {
        setControlDisabledStates({
          ...controlDisabledStates,
          customer: {
            nic: false,
            oldNic: false,
            name: false,
            otherName: false,
            postalAddress: false,
            nicAddress: false,
            telephone: false,
            telephone_2: false,
            notes: false,
            collapse: false,
          },
        });
      } else {
        setControlDisabledStates({
          ...controlDisabledStates,
          customer: {
            nic: true,
            title: true,
            oldNic: true,
            name: true,
            otherName: true,
            postalAddress: true,
            nicAddress: true,
            telephone: true,
            telephone_2: true,
            notes: true,
            collapse: false,
          },
        });
      }
    }

    if (isExistingCustomer === 'existing') {
      if (cookie.get('permissions').full_edit_customer) {
        setControlDisabledStates({
          ...controlDisabledStates,
          customer: {
            nic: false,
            title: false,
            oldNic: false,
            name: false,
            otherName: false,
            postalAddress: false,
            nicAddress: false,
            telephone: false,
            telephone_2: false,
            notes: false,
            collapse: false,
          },
        });
      } else {
        setControlDisabledStates({
          ...controlDisabledStates,
          customer: {
            nic: true,
            title: true,
            oldNic: true,
            name: true,
            otherName: true,
            postalAddress: false,
            nicAddress: false,
            telephone: false,
            telephone_2: false,
            notes: false,
            collapse: false,
          },
        });
      }
    }
  }, [customer, isExistingCustomer]);

  useEffect(() => {
    if (isOldPawning && !cookie.get('permissions').update_loan) {
      setControlDisabledStates({
        ...controlDisabledStates,
        billType: {
          billType: true,
          billNo: true,
          pawningDate: true,
        },
        items: {
          category: true,
          item: true,
          condition: true,
          condition_note: true,
          type: true,
          densimeter: true,
          count: true,
          weight: true,
          removeItem: true,
          addItems: true,
          collapse: false,
        },
        loan: {
          payableAmount: true,
          requiredAmount: true,
          isRenewal: true,
          renewalBillNo: true,
          //  isOldBill: true,
        },
      });
    }
  }, [pawningItems]);

  useEffect(() => {
    if (newLoan.bill_type_id) {
      setControlDisabledStates({
        ...controlDisabledStates,
        items: {
          ...controlDisabledStates.items,
          collapse: false,
        },
      });
    }

    if (newLoan.bill_type_id && !parseInt(newLoan.gold_value) === 0) {
      setControlDisabledStates({
        ...controlDisabledStates,
        loan: {
          payableAmount: false,
          requiredAmount: !cookie.get('permissions').update_loan ? false : true,
          isRenewal: false,
          renewalBillNo: false,
          //  isOldBill: false,
        },
      });
    }
  }, [newLoan.bill_type_id]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      setDisabledSaveBtn(false);
      setDisabledUpdateBtn(false);

      const response = await api.get(`newLoan/${cookie.get('user_branch')}`);

      let billTypes = [];
      console.log('branch iid : ' + cookie.get('user_branch'));
      if (cookie.get('user_roles') != 1) {
        // response.data.bill_types
        //   .map((bill_type) => {
        //     bill_type.branches
        //       .map((branch) => {
        //         if (
        //           branch.branch_id == cookie.get('user_branch') &&
        //           branch.bill_type_id == bill_type.id
        //         ) {

        //           if (branch.bill_count < 9999) {
        //             billTypes.push(bill_type);
        //           }
        //         }
        //       })
        //       .join('');
        //   })
        //   .join('');
        response.data.bill_types
          .map((bill_type) => {
            bill_type.branches
              .map((branch) => {
                if (
                  branch.branch_id == cookie.get('user_branch') &&
                  branch.bill_type_id == bill_type.id &&
                  branch.bill_count < 9999
                ) {
                  const uniqueIdentifier = `${bill_type.id}-${branch.branch_id}`;
                  if (
                    !billTypes.some(
                      (existingBillType) =>
                        existingBillType.uniqueIdentifier === uniqueIdentifier,
                    )
                  ) {
                    // Push the bill_type to the array with the unique identifier
                    billTypes.push({ ...bill_type, uniqueIdentifier });
                  }
                }
              })
              .join('');
          })
          .join('');
      } else {
        billTypes = [...response.data.bill_types];
      }
      //   billTypes.sort((a, b) => a.period.months - b.period.months);

      setBillTypes(billTypes);
      // setBillTypes(response.data.bill_types);
      setPermission({
        old_bill_disable: response.data.old_bill_save,
      });

      setItemCategories(response.data.category);

      setItemConditions(response.data.itemConditions);

      setStampFees(response.data.stamp_fee);

      setOfficers(response.data.officers);

      // setBillCounts(response.data.bill_counts);

      setIsLoading({
        ...isLoading,
        init: false,
      });

      const trans_date = await api.get(
        'trans_date/' + cookie.get('user_branch'),
      );
      setNewLoan({
        ...newLoan,
        ddate: trans_date.data,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const checkBillExist = async (bill_type_id, bill_no) => {
    const response = await api.post(`checkBillExist`).values({
      branch_id: newLoan.branch_id,
      bill_type_id: bill_type_id,
      bill_no: bill_no,
    });
    return response.data;
  };

  const loadBillForReNew = async (
    branch_id,
    bill_type_id,
    bill_no,
    bill_type,
    status,
  ) => {
    console.log('ckeckapprovetet');
    console.log(bill_type);
    console.log(bill_type_id);

    setloadBillTypeForApproval({
      //console.log(bill_type);
      // ...loadBillTypeForApproval,
      bill_type_id: bill_type_id,
      bill_no: bill_no,
      bill_type_name: bill_type,
    });
    // console.log('after renewrowdata');
    //  console.log(loadBillTypeForApproval);
    // draftRenewBillDetails.loan_id = loan_id
    draftRenewBillDetails.branch_id = branch_id;
    draftRenewBillDetails.bill_type_id = bill_type_id;
    draftRenewBillDetails.bill_no = bill_no;
    setIsRenewalPawning(true);
    setIsRedeemBillRenew(true);

    setIsLoading({
      ...isLoading,
      customer: true,
      history: true,
      init: true,
    });

    // * set officers
    const officers = await api.get(
      `show_officers/${cookie.get('user_branch')}`,
    );
    setOfficers(officers.data);

    // setIsRedeemBillRenew(true);
    // * get bill type name
    const bill_type_name = await api.get('get-bill-type-name/' + bill_type_id);

    // * get item categories list
    const category_list = await api.get('get-categories-list');
    if (category_list.status == 200 && category_list.data.status == 200) {
      setItemCategories(category_list.data.value);
    }

    const condition_list = await api.get('get-condition-list-all');
    if (condition_list.status == 200 && condition_list.data.status == 200) {
      setItemConditions(condition_list.data.value);
    }

    let response = '';
    // * get loan details
    if (status == 'load') {
      response = await api.post(`showLoan`).values({
        branch_id: branch_id,
        bill_type_id: bill_type_id,
        bill_type_name: bill_type_name.data.des,
        bill_no: bill_no,
      });
    } else {
      response = await api.post(`get-draft-renew-bill-details`).values({
        branch_id: branch_id,
        bill_type_id: bill_type_id,
        bill_type_name: bill_type_name.data.des,
        bill_no: bill_no,
      });
    }

    // * stamp fees
    const stamp_fees = await api.get(
      'stamp-fee-for-renew/' + cookie.get('user_branch'),
    );
    if (stamp_fees.status == 200 && stamp_fees.data.status == 200) {
      setStampFees(stamp_fees.data.data);
    }

    // * get bill type details (Buddhika)

    // *  old method for all bill types
    const res = await api.get(`newLoan/${cookie.get('user_branch')}`);
    let billTypes = [];
    console.log('branch iid : ' + cookie.get('user_branch'));
    if (cookie.get('user_roles') != 1) {
      res.data.bill_types
        .map((bill_type) => {
          bill_type.branches
            .map((branch) => {
              if (
                branch.branch_id == cookie.get('user_branch') &&
                branch.bill_type_id == bill_type.id
              ) {
                if (branch.bill_count < 9999) {
                  billTypes.push(bill_type);
                }
              }
            })
            .join('');
        })
        .join('');
    } else {
      billTypes = [...res.data.bill_types];
    }
    billTypes.sort((a, b) => a.period.months - b.period.months);
    setBillTypes(billTypes);
    const bill_type_details = await api.get(
      'get-renew-bill-type-and-bill-number/' +
        bill_type_id +
        '/' +
        bill_type_name.data.des +
        '/' +
        branch_id,
    );
    var renew_bill_type_id = '';
    var renew_bill_number = '';
    if (bill_type_details.data.data.length == 1) {
      const bill_count = await api.get(
        `bill-count/${cookie.get('user_branch')}/${
          bill_type_details.data.data[0].id
        }`,
      );
      renew_bill_type_id = bill_type_details.data.data[0].id;
      renew_bill_number = parseFloat(bill_count.data) + 1;
      setInterestRates(bill_type_details.data.data[0].int_rate);
    }

    // *  new method for relevent bill type
    // var renew_bill_type_id = ''
    // var renew_bill_number = ''
    // const bill_type_details = await api.get('get-renew-bill-type-and-bill-number/'+bill_type_id+'/'+bill_type_name.data.des+'/'+branch_id);
    // console.log('---------------------------------dsfsdfsdf')
    // console.log(bill_type_details.data.data)
    // setBillTypes([])
    // if (bill_type_details.data.data.length == 1) {
    //     const bill_count = await api.get(
    //         `bill-count/${cookie.get('user_branch')}/${bill_type_details.data.data[0].id}`,
    //     );
    //     renew_bill_type_id = bill_type_details.data.data[0].id
    //     renew_bill_number = bill_count.data
    //     setAllowChangeBillTypeWithoutChangeItems(false);
    // } else {
    //     setAllowChangeBillTypeWithoutChangeItems(true);
    // }
    // setBillTypes([...bill_type_details.data.data])
    // console.log('---------------------------------dsfsdfsdf')

    // return;
    // if (bill_type_details.status == 200) {
    //     console.log('inside asign')
    // } else {
    //     msg.error('Bill Type Loading Error !!')
    // }
    // console.log('bill types................');
    // console.log(billTypes);

    setIsLoading({
      ...isLoading,
      customer: true,
      history: true,
      init: false,
    });

    // setAllowEditItems(false);

    if (response.data.message) {
      msg.error(response.data.message);
      setIsLoading({
        ...isLoading,
        customer: false,
        history: false,
      });
      return;
    } else {
      let itemsArr = [];
      let loanTransArr = [];
      let stampFee = 0;
      let fmInt = 0;
      let adjustment = 0;
      let requiredAmt = 0;
      let refNo = '';

      setRenewData({
        ...renewData,
        oldLoanId: response.data[0].id,
        newAmount: response.data[0].loan_capital,
      });

      setBillTypeSearch({
        ...billTypeSearch,
        bill_type_id: bill_type_id,
        bill_type_name: bill_type_name.data.des,
      });

      setCustomer({
        branch_id: cookie.get('user_branch'),
        nic: response.data[0].customer.nic,
        old_nic: response.data[0].customer.old_nic,
        id: response.data[0].customer.id,
        name: response.data[0].customer.name,
        other_names: response.data[0].customer.other_names,
        address_1: response.data[0].customer.address_1,
        address_2: response.data[0].customer.address_2,
        telephone: response.data[0].customer.telephone,
        telephone_2: response.data[0].customer.telephone_2,
        notes: response.data[0].customer.notes,
        allowed_bills: response.data[0].customer.allowed_bills,
        is_blacklisted: response.data[0].customer.is_blacklisted,
      });

      response.data[0].loan_trans.forEach((trans) => {
        if (trans.trans_type_id === 11) {
          fmInt = trans.amount;
        }

        if (trans.trans_type_id === 10) {
          stampFee = trans.amount;
        }

        if (trans.trans_type_id === 23) {
          adjustment = trans.amount;
        }

        if (trans.trans_type_id === 1) {
          requiredAmt = trans.amount;
        }

        loanTransArr.push({
          ref_no: trans.ref_no,
          ddate: trans.ddate,
          trans_type_id: trans.trans_type_id,
          amount: trans.amount,
          bill_extended_period: trans.bill_extended_period,
        });

        refNo = trans.ref_no;
      });

      setTransactionData(loanTransArr);

      // * calculate final date
      const trans_date = await api.get(
        'trans_date/' + cookie.get('user_branch'),
      );
      var date = new Date(trans_date.data);
      var final_date = moment(
        new Date(
          date.setMonth(
            date.getMonth() + response.data[0].bill_type.period.months,
          ),
        ),
      ).format('YYYY-MM-DD');
      //   .format('MM/DD/YYYY')
      //   * commented
      let draft_deatils = {
        branch_id: branch_id,
        bill_type_id: bill_type_id,
        bill_no: bill_no,
      };
      setNewLoan({
        ...newLoan,
        id: response.data[0].id,
        branch_id: cookie.get('user_branch'),
        ddate: trans_date.data,
        final_date: final_date,
        total_weight: response.data[0].total_weight,
        gold_value: response.data[0].gold_value,
        // required_amount: 0,
        //parseFloat(response.data[0].required_amount).toFixed(2),
        // payable_amount: parseFloat(response.data[0].redeem_amount).toFixed(2),
        customer_id: response.data[0].customer_id,
        bill_type_id: renew_bill_type_id,
        bill_count: renew_bill_number,
        user: cookie.get('user_id'),
        // status: 'PENDING',
        // approval_remarks: '',
        // approving_officer: '',
        ref_no: response.data[0].ref_no,
        created_at: moment(response.data[0].created_at).format(
          `YYYY-MM-DD | HH:MM`,
        ),
        updated_at: moment(response.data[0].updated_at).format(
          `YYYY-MM-DD | HH:MM`,
        ),
        // stamp_fee_id: response.data[0].stamp_fee_id,
        // interest_rate_id: response.data[0].interest_rate_id,
        draft_bill_details: draft_deatils,
        is_renew: true,
        prev_ref_no: response.data[0].prev_ref_no,
      });

      // prettier-ignore
      //   * commented
      setAdditionalPawnData({
        //     ...additionalPawnData,
            duration: response.data[0].bill_type.period.des,
            months: response.data[0].bill_type.period.months,
            // fm_interest_rate: parseFloat(response.data[0].int_rate.fm_interest_rate).toFixed(2),
            // nm_interest_rate: parseFloat(response.data[0].int_rate.nm_interest_rate).toFixed(2),
        //     first_month_interest: parseFloat(roundup.round((parseFloat(response.data[0].int_rate.fm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100)).toFixed(2),
        //     next_month_interest: parseFloat(roundup.round((parseFloat(response.data[0].int_rate.nm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100)).toFixed(2),
        //     stamp_fee: parseFloat(response.data[0].stamp_fee.stamp_fee).toFixed(2),
        //     refNo: refNo,
        //     isRedeemed:response.data.redeemed_bill,
        //     operation: response.data[0].operation,
        //     additional_fees: response.data[0].additional_fees
          });
      // prettier-ignore-end

      // prettier-ignore
      let condition_ids = [];
      response.data[0].loan_item.forEach((item) => {
        condition_ids.push(item.item_condition_id);

        itemsArr.push({
          index: uuidv4(),
          id: item.id,
          category_id: item.item.category_id,
          items: [item.item],
          item_id: item.item_id,
          qty: item.qty,
          item_condition_id: item.item_condition_id,
          condition_note: item.condition_note,
          gold_rate: parseFloat(item.gold_rate.rate).toFixed(2),
          gold_rate_id: item.gold_rate_id,
          gold_weight: parseFloat(item.gold_weight).toFixed(2),
          gold_value: parseFloat(
            parseFloat(
              parseFloat(item.gold_weight) * parseFloat(item.gold_rate.rate),
            ) / parseFloat(8.0),
          ).toFixed(2),
          item_density: parseFloat(item.item_density),
        });
      });
      // prettier-ignore-end

      // * get item condition list
      const condition_list = await api.post('get-condition-list').values({
        condition_ids: condition_ids,
      });
      if (condition_list.status == 200 && condition_list.data.status == 200) {
        // setItemConditions(condition_list.data.value);
        // setItemConditions(condition_list.data.value);
      }
      setPawningItems(itemsArr);

      console.log(bill_type_name.data.id);

      console.log(billTypes);

      // ! check if old bill type of is active or not is it's inactive push current active bill type's gold_rates
      const old_bill_type_details = await api.get(
        `check-bill-type-status/${response.data[0].bill_type_id}`,
      );
      console.log(old_bill_type_details.data.loan_period_id);
      if (old_bill_type_details.data.is_active == false) {
        const exist_bill_type = billTypes.filter(
          (type) =>
            type.loan_period_id == old_bill_type_details.data.loan_period_id,
        );
        exist_bill_type[0].gold_rate
          .map((rate) => {
            response.data[0].bill_type.gold_rate.push(rate);
          })
          .join('');
      }

      const rates = response.data[0].bill_type.gold_rate.sort((a, b) => {
        if (a.gold_types && b.gold_types) {
          return b.gold_types.kt - a.gold_types.kt;
        }
        if (!a.gold_types && b.gold_types) {
          return 1; // Move b to a lower index, a to a higher index
        }
        if (a.gold_types && !b.gold_types) {
          return -1; // Move a to a lower index, b to a higher index
        }
        return 0; // Both a.gold_types and b.gold_types are null, maintain their order
      });

      // const uniqueGoldTypeIds = {};
      // const uniqueRates = [];
      // rates.forEach((rate) => {
      //   const goldTypeId = rate.gold_types.id;
      //   if (!uniqueGoldTypeIds[goldTypeId]) {
      //     uniqueGoldTypeIds[goldTypeId] = true;
      //     uniqueRates.push(rate);
      //   }
      // });

      // setGoldRates(response.data[0].bill_type.gold_rate);
      console.log('setgoldrates');
      console.log(rates);
      setGoldRates(rates);
      // Fetch customer's pawning history by id
      const custHistory = await api.get(
        `cust-history/${response.data[0].customer.id}`,
      );

      const response_count = await api.get(
        `getCustomerBillCounts/${response.data[0].customer.id}`,
      );

      if (response_count.data == 0) {
        confirmDialog({
          message: 'Do you want to Send for Approve ?',
          header: 'Customer Limit Exceed',
          headerClassName: 'text-danger',
          icon: 'pi pi-exclamation-triangle',
          position: 'center',
          closable: false,
          className: 'w-50 text-center',
          accept: () => {
            console.log('Accepted');
            // setShowSectionStates({
            //   ...showSectionStates,
            //   approvalConfirmationcuslimit: true,
            // });
            sendToCustomerApproval(response.data[0].customer.id);
          },
          reject: () => {
            console.log('Rejected');
            resetAll();
          },
        });
      }

      setLoanHistory({
        ...loanHistory,
        loans: custHistory.data[0].loan,
        pawning_count: custHistory.data[0].loan_count,
        redeem_count: custHistory.data[0].redeem_count,
        other_count: custHistory.data[0].other_count,
        redeemed_total: custHistory.data.redeemedAmountTot,
        pawning_total: custHistory.data.pawningAmountTot,
      });

      setControlDisabledStates({
        ...controlDisabledStates,
        loan: {
          payableAmount: false,
          requiredAmount: !cookie.get('permissions').update_loan ? false : true,
          isRenewal: false,
          renewalBillNo: false,
          // isOldBill: false,
        },
      });

      setIsLoading({
        ...isLoading,
        customer: false,
        history: false,
      });

      setShowSectionStates({
        ...showSectionStates,
        customerSection: true,
        transHistorySection: true,
        itemSection: true,
        toggleCancelBills: false,
        toggleRenewDraftBills: false,
      });

      if (response.data.redeemed_bill) {
        msg.info_stick(
          `This bill was redeemed on ${moment(
            response.data[0].redeem_date,
          ).format('YYYY-MM-DD')}`,
        );
      }

      setDisablenic(false);
      //   payableAmountChange(parseFloat(response.data[0].redeem_amount).toFixed(2))
      //   calculateLoanAmount();

      if (cookie.get('user_roles') != 1) {
        console.log('userid22');
        if (cookie.get('user_roles') == 2) {
          console.log('ttrt');
          setAllowEditItems(true);
          setEnablechangeCustomer(true);
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: true,
              oldNic: true,
              name: true,
              otherName: true,
              nicAddress: true,
              notes: true,
              collapse: true,
              postalAddress: false,
              telephone: true,
              telephone_2: false,
            },
            items: {
              category: false,
              item: false,
              condition: false,
              condition_note: false,
              type: false,
              densimeter: false,
              count: false,
              weight: false,
              removeItem: false,
              addItems: false,
              collapse: false,
            },
            billType: {
              billType: false,
              billNo: false,
              pawningDate: false,
            },
            saveButton: true,
            // loan: {
            //   payableAmount: true,
            //   requiredAmount: true,
            //   isRenewal: true,
            //   renewalBillNo: true,
            //   isOldBill: true,
            // },
          });
        } else {
          setAllowEditItems(false);
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: true,
              oldNic: true,
              name: true,
              otherName: true,
              nicAddress: true,
              notes: true,
              collapse: true,
              postalAddress: false,
              telephone: false,
              telephone_2: false,
            },
            items: {
              category: true,
              item: true,
              condition: true,
              condition_note: true,
              type: true,
              densimeter: true,
              count: true,
              weight: true,
              removeItem: true,
              addItems: true,
              collapse: true,
            },
            saveButton: true,
            // loan: {
            //   payableAmount: true,
            //   requiredAmount: true,
            //   isRenewal: true,
            //   renewalBillNo: true,
            //   isOldBill: true,
            // },
          });
          setEnablechangeCustomer(true);
        }
      } else {
        if (cookie.get('user_roles') == 2) {
          console.log('ttrt');
          setAllowEditItems(true);
          setEnablechangeCustomer(true);
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: true,
              oldNic: true,
              name: true,
              otherName: true,
              nicAddress: true,
              notes: true,
              collapse: true,
              postalAddress: false,
              telephone: true,
              telephone_2: false,
            },
            items: {
              category: false,
              item: false,
              condition: false,
              condition_note: false,
              type: false,
              densimeter: false,
              count: false,
              weight: false,
              removeItem: false,
              addItems: false,
              collapse: false,
            },
            billType: {
              billType: false,
              billNo: false,
              pawningDate: false,
            },
            saveButton: true,
            // loan: {
            //   payableAmount: true,
            //   requiredAmount: true,
            //   isRenewal: true,
            //   renewalBillNo: true,
            //   isOldBill: true,
            // },
          });
        } else {
          console.log('userid');
          setAllowEditItems(true);
          setEnablechangeCustomer(false);
          setControlDisabledStates({
            ...controlDisabledStates,
            // customer: {
            //   nic: true,
            //   title: true,
            //   oldNic: true,
            //   name: true,
            //   otherName: true,
            //   nicAddress: true,
            //   notes: true,
            //   collapse: true,
            //   postalAddress: true,
            //   telephone: true,
            //   telephone_2: true,
            // },
            // items: {
            //   category: true,
            //   item: true,
            //   condition: true,
            //   condition_note: true,
            //   type: true,
            //   densimeter: true,
            //   count: true,
            //   weight: true,
            //   removeItem: true,
            //   addItems: true,
            //   collapse: true,
            // },
            saveButton: true,
            // loan: {
            //   payableAmount: true,
            //   requiredAmount: true,
            //   isRenewal: true,
            //   renewalBillNo: true,
            //   isOldBill: true,
            // },
          });
        }
      }
    }
  };

  const payableAmountChange = async (value) => {
    const stamp_fee = await selectStampFee(value);
    const int_amounts = await calInterestAndAmount(value, stamp_fee.fee);

    // prettier-ignore
    const requiredOriginal = parseFloat(int_amounts.req_amount_original).toFixed(2);
    // prettier-ignore-end

    // prettier-ignore
    const required = parseFloat(int_amounts.req_amount).toFixed(2);
    // prettier-ignore-end
    setTransactionData([
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '1',
        amount: required,
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '11',
        amount: parseFloat(int_amounts.final_fm_interest),
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '10',
        amount: stamp_fee.fee,
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '23',
        amount:
          parseFloat(required) -
          parseFloat(
            parseFloat(roundup.round(int_amounts.final_fm_interest)) +
              parseFloat(stamp_fee) +
              parseFloat(value),
          ),
        bill_extended_period: '4',
      },
    ]);

    setNewLoan({
      ...newLoan,
      payable_amount: value,
      required_amount: required,
      stamp_fee_id: stamp_fee.fee_id,
      interest_rate_id: int_amounts.rate_id,
    });

    // prettier-ignore
    // setAdditionalPawnData({
    //   ...additionalPawnData,
    //   stamp_fee: parseFloat(stamp_fee.fee).toFixed(2),
    //   fm_interest_rate: parseFloat(int_amounts.fm_interest_rate).toFixed(2),
    //   nm_interest_rate: parseFloat(int_amounts.nm_interest_rate).toFixed(2),
    //   first_month_interest: parseFloat(int_amounts.final_fm_interest).toFixed(2),
    //   next_month_interest: parseFloat(int_amounts.nm_interest).toFixed(2),
    // });

    setAdditionalPawnData({
            ...additionalPawnData,
            stamp_fee: roundup.round(stamp_fee.fee),
            fm_interest_rate: roundup.round(int_amounts.fm_interest_rate),
            nm_interest_rate: roundup.round(int_amounts.nm_interest_rate),
            first_month_interest: parseFloat(roundup.round(int_amounts.final_fm_interest)).toFixed(2),
            next_month_interest: parseFloat(roundup.round(int_amounts.nm_interest)).toFixed(2),
        });
  };

  const fetchCustomerOrBill = async () => {
    try {
      setNewLoan({
        ...newLoan,
        calculation_mode: 'FORWARD',
      });
      setIsLoading({
        ...isLoading,
        customer: true,
        history: true,
      });
      setLoadNewBill(true);

      const response = await api.post(`showLoan`).values({
        branch_id: cookie.get('user_branch'),
        bill_type_id: billTypeSearch.bill_type_id,
        bill_type_name: billTypeSearch.bill_type_name,
        bill_no: billTypeSearch.bill_no,
      });

      console.log('loading a bill');
      console.log(response.data);

      if (response.data.message) {
        msg.error(response.data.message);
        setIsLoading({
          ...isLoading,
          customer: false,
          history: false,
        });
        setLoadNewBill(false);
        return;
      } else {
        console.log(response.data[0].status);
        response.data[0].status == 'C'
          ? setIsCancelBill(true)
          : setIsCancelBill(false);
        let itemsArr = [];
        let loanTransArr = [];
        let stampFee = 0;
        let fmInt = 0;
        let adjustment = 0;
        let requiredAmt = 0;
        let refNo = '';

        setRenewData({
          ...renewData,
          oldLoanId: response.data[0].id,
          newAmount: response.data[0].loan_capital,
        });

        console.log('title : ' + response.data[0].customer.title);
        setCustomer({
          branch_id: cookie.get('user_branch'),
          nic: response.data[0].customer.nic,
          title: response.data[0].customer.title,
          old_nic: response.data[0].customer.old_nic,
          id: response.data[0].customer.id,
          name: response.data[0].customer.name,
          other_names: response.data[0].customer.other_names,
          address_1: response.data[0].customer.address_1,
          address_2: response.data[0].customer.address_2,
          telephone: response.data[0].customer.telephone,
          telephone_2: response.data[0].customer.telephone_2,
          notes: response.data[0].customer.notes,
          allowed_bills: response.data[0].customer.allowed_bills,
          is_blacklisted: response.data[0].customer.is_blacklisted,
        });

        response.data[0].loan_trans.forEach((trans) => {
          if (trans.trans_type_id === 11) {
            fmInt = trans.amount;
          }

          if (trans.trans_type_id === 10) {
            stampFee = trans.amount;
          }

          if (trans.trans_type_id === 23) {
            adjustment = trans.amount;
          }

          if (trans.trans_type_id === 1) {
            requiredAmt = trans.amount;
          }

          loanTransArr.push({
            ref_no: trans.ref_no,
            ddate: trans.ddate,
            trans_type_id: trans.trans_type_id,
            amount: trans.amount,
            bill_extended_period: trans.bill_extended_period,
          });

          refNo = trans.ref_no;
        });

        setTransactionData(loanTransArr);

        // console.log('calculation mode : '+response.data[0].calculation_mode)
        // console.log('edit status : '+isEdit)
        // setCalculationMode(response.data[0].calculation_mode)

        // prettier-ignore
        setNewLoan({
            id: response.data[0].id,
            branch_id: cookie.get('user_branch'),
            // ddate: cookie.get('new_date') ? cookie.get('new_date') : response.data[0].ddate,
            ddate: response.data[0].ddate,
            final_date: response.data[0].final_date,
            total_weight: response.data[0].total_weight,
            gold_value: response.data[0].gold_value,
            required_amount: parseFloat(response.data[0].required_amount).toFixed(2),
            payable_amount: parseFloat(response.data[0].loan_capital).toFixed(2),
            customer_id: response.data[0].customer_id,
            bill_type_id: billTypeSearch.bill_type_id,
            // bill_type_id: response.data[0].bill_type_id,
            bill_count: response.data[0].bill_no,
            stamp_fee_id: response.data[0].stamp_fee_id,
            remd_letr_no: response.data[0].remd_letr_no,
            user: cookie.get('user_id'),
            status: 'PENDING',
            approval_remarks: response.data[0].approval_remarks,
            approving_officer: response.data[0].approving_officer,
            service_charge: response.data[0].service_charge,
            additional_fees: response.data[0].additional_fees,
            ref_no: response.data[0].ref_no,
            interest_rate_id: response.data[0].interest_rate_id,  
            is_old_bill: response.data[0].is_old_bill == 1 ? true : false,
            created_at: moment(response.data[0].created_at).format(`YYYY-MM-DD | HH:MM`),
            updated_at: moment(response.data[0].updated_at).format(`YYYY-MM-DD | HH:MM`),
            is_renew: response.data[0].is_renew,
            stat: response.data[0].is_renew == true ? 'RE' : response.data[0].status,
            old_bill_type_id:response.data[0].old_bill_type_num,
            old_bill_no:response.data[0].old_bill_num,
            calculation_mode: response.data[0].calculation_mode,
            prev_ref_no: response.data[0].prev_ref_no
        });

        // prettier-ignore
        setAdditionalPawnData({
            ...additionalPawnData,
            duration: response.data[0].bill_type.period.des,
            months: response.data[0].bill_type.period.months,
            fm_interest_rate: parseFloat(response.data[0].int_rate.fm_interest_rate).toFixed(2),
            nm_interest_rate: parseFloat(response.data[0].int_rate.nm_interest_rate).toFixed(2),
            first_month_interest: parseFloat(roundup.round((parseFloat(response.data[0].int_rate.fm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100)).toFixed(2),
            next_month_interest: parseFloat(roundup.round((parseFloat(response.data[0].int_rate.nm_interest_rate) * parseFloat(response.data[0].required_amount)) / 100)).toFixed(2),
            stamp_fee: parseFloat(response.data[0].stamp_fee.stamp_fee).toFixed(2),
            refNo: refNo,
            isRedeemed:response.data.redeemed_bill,
            additional_fees: response.data[0].additional_fees,
            operation: response.data[0].operation,
            ref_no: response.data[0].ref_no
        });

        // prettier-ignore-end

        // prettier-ignore
        response.data[0].loan_item.forEach((item) => {
            itemsArr.push({
                index: uuidv4(),
                id: item.id,
                category_id: item.item.category_id,
                items: [item.item],
                item_id: item.item_id,
                qty: item.qty,
                item_condition_id: item.item_condition_id,
                condition_note: item.condition_note,
                gold_rate: parseFloat(item.gold_rate.rate).toFixed(2),
                gold_rate_id: item.gold_rate_id,
                gold_weight: parseFloat(item.gold_weight).toFixed(2),
                gold_value: parseFloat(parseFloat(parseFloat(item.gold_weight) * parseFloat(item.gold_rate.rate)) / parseFloat(8.0)).toFixed(2),
                item_density: parseFloat(item.item_density),
            });
        });
        // prettier-ignore-end

        // ! check if old bill type of is active or not is it's inactive push current active bill type's gold_rates
        const old_bill_type_details = await api.get(
          `check-bill-type-status/${response.data[0].bill_type_id}`,
        );
        if (old_bill_type_details.data.is_active == false) {
          const exist_bill_type = billTypes.filter(
            (bill_type) => bill_type.des == billTypeSearch.bill_type_name,
          );
          exist_bill_type[0].gold_rate
            .map((rate) => {
              response.data[0].bill_type.gold_rate.push(rate);
            })
            .join('');
        }

        setPawningItems(itemsArr);
        const rates = response.data[0].bill_type.gold_rate.sort((a, b) => {
          if (a.gold_types && b.gold_types) {
            return b.gold_types.kt - a.gold_types.kt;
          }
          // Handle the case when either a.gold_types or b.gold_types is null
          // You can choose how to handle this situation, such as treating null as a lower value or returning 0
          // For example, treating null as a lower value:
          if (!a.gold_types && b.gold_types) {
            return 1; // Move b to a lower index, a to a higher index
          }
          if (a.gold_types && !b.gold_types) {
            return -1; // Move a to a lower index, b to a higher index
          }
          return 0; // Both a.gold_types and b.gold_types are null, maintain their order
        });

        setGoldRates(rates);

        // Fetch customer's pawning history by id
        const custHistory = await api.get(
          `cust-history/${response.data[0].customer.id}`,
        );

        const response_count = await api.get(
          `getCustomerBillCounts/${response.data[0].customer.id}`,
        );

        if (allowEditItems != true) {
          if (response_count.data == 0) {
            confirmDialog({
              message: 'Do you want to Send for Approve ?',
              header: 'Customer Limit Exceed',
              headerClassName: 'text-danger',
              icon: 'pi pi-exclamation-triangle',
              position: 'center',
              closable: false,
              className: 'w-50 text-center',
              accept: () => {
                //console.log('Accepted');
                // setShowSectionStates({
                //   ...showSectionStates,
                //   approvalConfirmationcuslimit: true,
                // });
                sendToCustomerApproval(response.data[0].customer.id);
              },
              reject: () => {
                console.log('Rejected');
                resetAll();
              },
            });
          }
        }

        setLoanHistory({
          ...loanHistory,
          loans: custHistory.data[0].loan,
          pawning_count: custHistory.data[0].loan_count,
          redeem_count: custHistory.data[0].redeem_count,
          other_count: custHistory.data[0].other_count,
          redeemed_total: custHistory.data.redeemedAmountTot,
          pawning_total: custHistory.data.pawningAmountTot,
        });

        setIsLoading({
          ...isLoading,
          customer: false,
          history: false,
        });

        setShowSectionStates({
          ...showSectionStates,
          customerSection: true,
          transHistorySection: true,
          itemSection: true,
          toggleCancelBills: false,
          toggleRenewDraftBills: false,
        });

        if (response.data.redeemed_bill) {
          msg.info_stick(
            `This bill was redeemed on ${moment(
              response.data[0].redeem_date,
            ).format('YYYY-MM-DD')}`,
          );
        }
        if (cookie.get('user_roles') == 1 || cookie.get('user_roles') == 2) {
          setAllowEditItems(true);
        }

        if (cookie.get('user_roles') == 2) {
          console.log('ggj');
          setEnablechangeCustomer(true);
          setAllowEditItems(true);
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: true,
              oldNic: true,
              name: true,
              otherName: true,
              nicAddress: true,
              notes: true,
              collapse: true,
              postalAddress: false,
              telephone: true,
              telephone_2: false,
            },
            billType: {
              billType: true,
              billNo: true,
              pawningDate: true,
            },
            // items: {
            //   category: false,
            //   item: false,
            //   condition: false,
            //   condition_note: false,
            //   type: false,
            //   densimeter: false,
            //   count: false,
            //   weight: false,
            //   removeItem: false,
            //   addItems: false,
            //   collapse: false,
            // },
            saveButton: true,
            // loan: {
            //   payableAmount: true,
            //   requiredAmount: true,
            //   isRenewal: true,
            //   renewalBillNo: true,
            //   isOldBill: true,
            // },
          });
        }
        setDisabledUpdateBtn(false);
      }
    } catch (error) {
      setIsLoading({
        ...isLoading,
        init: false,
      });
      return msg.error('Unable to fetch data!');
    }
    // }
  };

  const filterItemsList = async (e) => {
    const datasetId = e.target.dataset.id;
    const targetValue = e.target.value;

    try {
      setIsLoading({
        ...isLoading,
        items: true,
      });

      const response = await api.get(`items-by-category/${targetValue}`);

      setPawningItems(
        [...pawningItems],
        (pawningItems[datasetId].category_id = targetValue),
        (pawningItems[datasetId].items = response.data),
        (pawningItems[datasetId].item_id = ''),
      );
    } catch (error) {
      return msg.error(error);
    } finally {
      setIsLoading({
        ...isLoading,
        items: false,
      });
    }
  };

  const enableNIC = () => {
    setControlDisabledStates({
      ...controlDisabledStates,
      customer: {
        ...controlDisabledStates.customer,
        nic: false,
      },
    });
    setDisablenic(true);
    setCustomer({
      branch_id: cookie.get('user_branch'),
      nic: '',
      old_nic: '',
      id: '',
      title: '',
      name: '',
      other_names: '',
      address_1: '',
      address_2: '',
      telephone: '',
      telephone_2: '',
      notes: '',
      allowed_bills: '',
      is_blacklisted: false,
    });
  };

  const validateControlValues = (input, value) => {
    /**
     * This function can be used to validate any input value when the onChange (or onKeyPress, or onKeyDown, or whatever tf you like...) event fires
     * Pass the form element's name as the 1st parameter, @param {any} input
     * And the value needs to be validated as the 2nd, @param {any} value
     * Use the promise to do any required validation and resolve with true
     * Don't use reject coz it's not handled in the onChange event
     */

    return new Promise((resolve, reject) => {
      if (input === 'qty') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value) || value.includes('.')) {
            msg.warning('Count can only be an integer');
          } else if (parseFloat(value) > 9999) {
            msg.warning('Count, Enter only 4 digits.');
          } else {
            resolve(true);
          }
        }
      } else if (input === 'item_density') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value) || value.includes('.')) {
            msg.warning('Densimeter KT can only be an integer');
          } else if (parseFloat(value) > 99) {
            msg.warning('Densimeter KT, Enter only 2 digits');
          } else {
            resolve(true);
          }
        }
      } else if (input === 'gold_weight') {
        if (value === '') {
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Gold weight must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 3
              : false
          ) {
            msg.warning(
              'Gold weight must NOT exceed 3 values after the decimal point',
            );
          } else if (parseFloat(value) > 99999.999) {
            msg.warning('Gold weight too big amount please recheck.');
          } else {
            resolve(true);
          }
        }
      } else if (input === 'payable_amount') {
        if (value === '') {
          msg.warning('Amount should not be empty');
          resolve(true);
        } else {
          if (isNaN(value)) {
            msg.warning('Loan amount must be a number');
          } else if (
            value.indexOf('.') != -1
              ? value.substring(value.indexOf('.') + 1).length > 2
              : false
          ) {
            msg.warning(
              'Loan amount must NOT exceed 2 values after the decimal point',
            );
          } else {
            console.log(value.charAt(value.length - 1));
            if (value.charAt(value.length - 1) != '.') {
              resolve(true);
            }
          }
        }
      } else {
        resolve(true);
      }
    });
  };

  const checkPayableAmount = async (e) => {
    // e = (e) ? e : window.event;
    // var charCode = (e.which) ? e.which : e.keyCode;
    // console.log(charCode)
    // if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode == 110 && charCode == 190) {
    // // if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46 && charCode !== 44) {
    //     e.preventDefault();
    // } else {
    //     return true;
    // }
  };

  const selectAllText = (e) => {
    e.target.select();
  };

  const handleItemsChange = async (e) => {
    const targetInput = e.target;
    const datasetId = targetInput.dataset.id;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;
    const setOfItems = [...pawningItems];

    const validated = await validateControlValues(inputName, inputValue);

    if (validated) {
      setOfItems[datasetId][inputName] = inputValue;
      setPawningItems(setOfItems);
    }

    if (inputName === 'gold_weight' || inputName === 'gold_rate_id') {
      if (
        pawningItems[datasetId].gold_weight &&
        pawningItems[datasetId].gold_rate_id
      ) {
        calItemValue(inputName, datasetId, inputValue);
      } else {
        calItemValue(inputName, datasetId, 0);
      }
    }
  };

  const calItemValue = (inputName, index, inputVal) => {
    // prettier-ignore
    let rateData = goldRates.filter(
      (rate) =>
        parseInt(rate.id) === parseInt(pawningItems[index].gold_rate_id),
    );

    let setOfItems = [...pawningItems];

    Promise.all(rateData).then((res) => {
      if (inputName === 'gold_weight') {
        setOfItems[index]['gold_value'] = (
          (parseFloat(res[0].rate).toFixed(2) / parseFloat(8.0).toFixed(3)) *
          parseFloat(inputVal).toFixed(3)
        ).toFixed(2);

        setPawningItems(setOfItems);
      } else if (inputName === 'gold_rate_id') {
        setOfItems[index]['gold_value'] = (
          (parseFloat(res[0].rate).toFixed(2) / parseFloat(8.0).toFixed(3)) *
          parseFloat(pawningItems[index].gold_weight).toFixed(3)
        ).toFixed(2);
        setOfItems[index]['gold_rate'] = parseFloat(res[0].rate).toFixed(2);

        setPawningItems(setOfItems);
      }
    });
    // prettier-ignore-end
  };

  useEffect(() => {
    calItemTotals();
  }, [pawningItems]);

  const calItemTotals = () => {
    let totGoldWeight = 0;
    let totGoldValue = 0;

    pawningItems.map((item) => {
      if (item.gold_weight) {
        totGoldWeight = (
          parseFloat(totGoldWeight) + parseFloat(item.gold_weight)
        ).toFixed(2);
      }
      if (item.gold_value) {
        totGoldValue = (
          parseFloat(totGoldValue) + parseFloat(item.gold_value)
        ).toFixed(2);
      }
    });

    setNewLoan({
      ...newLoan,
      gold_value: Number.isNaN(parseFloat(totGoldValue)) ? 0 : totGoldValue,
      total_weight: Number.isNaN(parseFloat(totGoldWeight)) ? 0 : totGoldWeight,
    });
  };

  const handleCustomerSearch = (e) => {
    console.log('call handle customer search');
    if (e.keyCode === 13) {
      changeCustomer();
    }
  };

  const handleBillSearch = async (e) => {
    if (e.keyCode === 13) {
      const response = await checkBillExist(
        newLoan.bill_type_id,
        newLoan.bill_count,
      );
      if (
        response.status == 500 ||
        response.status == 'NOTFOUND' ||
        response.bill_status == 'D' ||
        response.bill_status == 'C'
      ) {
        msg.error('Fill Type Not Found !!');
        resetAll();
      } else if (response.bill_status == 'F') {
        msg.info(
          'This Bill Marked As Forfeited Belongs to Batch No:'.response
            .batch_number,
        );

        // billTypeSearch.bill_type_id = response.bill_type_id
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: newLoan.bill_type_id,
          // bill_type_name: dataset.billtype,
        });

        controlDisabledStates.saveButton =
          response.table === 'Other Loan' ? false : true;
        setIsEdit(false);
        setAllowEditItems(false);

        await fetchCustomerOrBill();
      } else if (response.bill_status == 'PF') {
        msg.info(
          'This Bill Marked As Pending Forfeited Belongs to Batch No:' +
            response.batch_number,
        );

        // billTypeSearch.bill_type_id = response.bill_type_id
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: newLoan.bill_type_id,
          // bill_type_name: dataset.billtype,
        });

        controlDisabledStates.saveButton =
          response.table === 'Other Loan' ? false : true;
        setIsEdit(false);
        setAllowEditItems(false);

        await fetchCustomerOrBill();
      } else {
        controlDisabledStates.saveButton =
          response.table === 'Redeem Loan' ? false : true;
        // billTypeSearch.bill_type_id = response.bill_type_id
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: newLoan.bill_type_id,
          // bill_type_name: dataset.billtype,
        });
        if (
          response.allow_edit_customer === true &&
          response.allow_edit_items === true
        ) {
          setIsEdit(true);
          setAllowEditItems(true);
        } else if (
          response.allow_edit_customer === true &&
          response.allow_edit_items === false
        ) {
          setIsEdit(true);
          setAllowEditItems(false);
        } else {
          controlDisabledStates.saveButton =
            response.table === 'Redeem Loan' ? false : true;
          setIsEdit(false);
          setAllowEditItems(false);
        }
        console.log('allow edit items status : ' + allowEditItems);
        console.log('edit status : ' + isEdit);
        await fetchCustomerOrBill();
      }
      // if (billstatus == 1) {
      //     setIsEdit(true);
      //     if (edit_status == 1) {
      //         setAllowEditItems(true);
      //     } else {
      //         setAllowEditItems(false);
      //         msg.warning('You allowed to change customer only of this bill number');
      //     }
      //     await fetchCustomerOrBill(dataSection);
      // } else {
      //     await fetchCustomerOrBill(dataSection);
      //     setIsEdit(false);
      //     setAllowEditItems(false);
      //     setNewLoan({
      //         ...newLoan,
      //         stat: 'R'
      //     });
      //     // msg.warning('This Bill Number is Not Exist');
      //     // resetAll();
      // }
    }
  };

  const changeCustomer = async () => {
    const response = await api.get('customers/' + customer.nic);
    if (response.status == 200) {
      if (Object.keys(response.data).length > 0) {
        setCustomer({
          ...customer,
          branch_id: cookie.get('user_branch'),
          nic: response.data.nic,
          title: response.data.title,
          old_nic: response.data.old_nic,
          id: response.data.id,
          name: response.data.name,
          other_names: response.data.other_names,
          address_1: response.data.address_1,
          address_2: response.data.address_2,
          telephone: response.data.telephone,
          telephone_2: response.data.telephone_2,
          notes: response.data.notes,
          allowed_bills: response.data.allowed_bills,
          is_blacklisted: response.data.is_blacklisted,
        });

        if (response.data.is_blacklisted == 1) {
          msg.warning_stick(`Black List Customer`);
        }

        if (cookie.get('user_roles') == 1) {
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: false,
              oldNic: false,
              name: false,
              otherName: false,
              postalAddress: false,
              nicAddress: false,
              telephone: false,
              notes: false,
              collapse: false,
            },
          });
        } else {
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: true,
              oldNic: false,
              name: true,
              otherName: false,
              postalAddress: false,
              nicAddress: false,
              telephone: false,
              notes: false,
              collapse: false,
            },
          });
        }
        setNewLoan({
          ...newLoan,
          customer_id: response.data.id,
        });
        const custHistory = await api.get(`cust-history/${response.data.id}`);
        const response_count = await api.get(
          `getCustomerBillCounts/${response.data.id}`,
        );

        if (response_count.data == 0) {
          confirmDialog({
            message: 'Do you want to Send for Approve ?',
            header: 'Customer Limit Exceed',
            headerClassName: 'text-danger',
            icon: 'pi pi-exclamation-triangle',
            position: 'center',
            closable: false,
            className: 'w-50 text-center',
            accept: () => {
              //  console.log('Accepted');
              // setShowSectionStates({
              //   ...showSectionStates,
              //   approvalConfirmationcuslimit: true,
              // });
              sendToCustomerApproval(response.data.id);
            },
            reject: () => {
              // console.log('Rejected');
              resetAll();
            },
          });
        }
        setLoanHistory({
          ...loanHistory,
          loans: custHistory.data[0].loan,
          pawning_count: custHistory.data[0].loan_count,
          redeem_count: custHistory.data[0].redeem_count,
          other_count: custHistory.data[0].other_count,
          redeemed_total: custHistory.data.redeemedAmountTot,
          pawning_total: custHistory.data.pawningAmountTot,
        });
      } else {
        console.log('customer not found');
        console.log('edit status : ' + isEdit);
        if (isEdit == false) {
          setControlDisabledStates({
            ...controlDisabledStates,
            customer: {
              nic: true,
              title: false,
              oldNic: false,
              name: false,
              otherName: false,
              postalAddress: false,
              nicAddress: false,
              telephone: false,
              notes: false,
              collapse: false,
            },
          });
        } else {
          if (cookie.get('user_roles') == 1) {
            setControlDisabledStates({
              ...controlDisabledStates,
              customer: {
                nic: false,
                title: false,
                oldNic: false,
                name: false,
                otherName: false,
                postalAddress: false,
                nicAddress: false,
                telephone: false,
                notes: false,
                collapse: false,
              },
            });
            // ! if customer not found should have to update loan customer id as empty
            setNewLoan({
              ...newLoan,
              customer_id: '',
            });
          }
        }
        setCustomer({
          ...customer,
          old_nic: '',
          id: '',
          name: '',
          other_names: '',
          address_1: '',
          address_2: '',
          telephone: '',
          notes: '',
          allowed_bills: '',
        });
        setLoanHistory({
          ...loanHistory,
          loans: [],
          pawning_count: 0,
          redeem_count: 0,
          other_count: 0,
          redeemed_total: 0,
          pawning_total: 0,
        });
      }
    } else {
      msg.error('customer loading Error');
    }
  };

  const handleCustomerValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'nic') {
      setIsOldPawning(false);
      setDisablenic(false);
      setCustomerNic(inputValue);
    }
    if (inputName === 'title') {
      setCustomer({
        ...customer,
        [inputName]: inputValue,
        name: inputValue + ' ' + customer.name,
      });
    } else if (inputName == 'name') {
      const { value } = e.target;
      const onlyAlphabet = /^[A-Za-z\s.]+$/;
      if (onlyAlphabet.test(value) || value === '') {
        setCustomer({
          ...customer,
          [inputName]: value,
        });
      }
    } else if (inputName == 'address_1' || inputName == 'address_2') {
      setCustomer({
        ...customer,
        [inputName]: inputValue.toUpperCase(),
      });
    } else {
      setCustomer({
        ...customer,
        [inputName]: inputValue,
      });
    }
  };

  const handlePawningAmountChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    const dataset =
      targetInput.type == 'select-one'
        ? targetInput.options[e.target.selectedIndex].dataset
        : targetInput.dataset;

    const validated = await validateControlValues(inputName, inputValue);

    const expDate = moment().add(1, 'days').utc().toDate();

    if (inputName == 'ddate') {
      if (cookie.get('user_role') == 1) {
        cookie.set('new_date', inputValue, { path: '/', expires: expDate });
        setNewLoan({
          ...newLoan,
          ddate: inputValue,
        });
      }
    }

    if (validated) {
      if (inputName === 'bill_count') {
        console.log('change input');
        setBillTypeSearch({
          ...billTypeSearch,
          bill_no: inputValue,
        });
        setNewLoan({
          ...newLoan,
          bill_count: inputValue,
        });
      }

      if (inputName === 'bill_type_id') {
        setIsLoading({
          ...isLoading,
          billCount: true,
        });
        setBillTypeSearch({
          ...billTypeSearch,
          bill_type_id: inputValue,
          bill_type_name: dataset.billtype,
        });

        billTypes.map(async (bill) => {
          if (parseInt(bill.id) === parseInt(inputValue)) {
            setIsLoading({
              ...isLoading,
              billCount: true,
            });

            setNewLoan({
              ...newLoan,
              final_date: moment(newLoan.ddate)
                .add(bill.period.months, 'months')
                .format('MM/DD/YYYY'),
              // .format('YYYY-MM-DD'),
            });

            const response = await api.get(
              `bill-count/${cookie.get('user_branch')}/${inputValue}`,
            );

            if (!isRedeemBillRenew) {
              setNewLoan({
                ...newLoan,
                bill_count: parseInt(response.data) + parseInt(1),
                bill_type_id: bill.id,
                final_date: moment(newLoan.ddate)
                  .add(bill.period.months, 'months')
                  //   .format('MM/DD/YYYY'),
                  .format('YYYY-MM-DD'),
                // gold_value: 0,
                // total_weight: 0,
              });
            } else {
              setNewLoan({
                ...newLoan,
                bill_count: parseInt(response.data) + parseInt(1),
                bill_type_id: bill.id,
                final_date: moment(newLoan.ddate)
                  .add(bill.period.months, 'months')
                  //   .format('MM/DD/YYYY'),
                  .format('YYYY-MM-DD'),
                // gold_value: 0,
                // total_weight: 0,
              });
            }

            // let goldRates = [];
            // bill.gold_rate.map((rate) => {
            //   goldRates.push({
            //     ...rate,
            //     kt: rate.gold_types.category.substring(
            //       0,
            //       rate.gold_types.category.indexOf('K'),
            //     ),
            //   });
            // });

            // let goldRates = [...bill.gold_rate];
            // goldRates.sort((a, b) => b.gold_types.kt - a.gold_types.kt);

            const goldTypes = bill.gold_rate;
            // console.log(goldTypes);
            const rates = goldTypes.sort((a, b) => {
              if (a.gold_types && b.gold_types) {
                return b.gold_types.kt - a.gold_types.kt;
              }
              // Handle the case when either a.gold_types or b.gold_types is null
              // You can choose how to handle this situation, such as treating null as a lower value or returning 0
              // For example, treating null as a lower value:
              if (!a.gold_types && b.gold_types) {
                return 1; // Move b to a lower index, a to a higher index
              }
              if (a.gold_types && !b.gold_types) {
                return -1; // Move a to a lower index, b to a higher index
              }
              return 0; // Both a.gold_types and b.gold_types are null, maintain their order
            });

            console.log('setgoldrate333s');
            setGoldRates(rates);
            // setGoldRates(goldTypes);

            // if(goldRates[0].kt!=24){
            //     goldRates.reverse((a, b) => a.kt - b.kt);
            // }
            // setGoldRates(goldRates);

            // setGoldRates(bill.gold_rate);

            setInterestRates(bill.int_rate);

            setAdditionalPawnData({
              ...additionalPawnData,
              duration: bill.period.des,
              months: bill.period.months,
            });

            setIsLoading({
              ...isLoading,
              billCount: false,
            });
          }

          if (!isRedeemBillRenew) {
            setPawningItems([
              {
                index: uuidv4(),
                category_id: '',
                items: [],
                item_id: '',
                qty: '',
                item_condition_id: '',
                condition_note: '',
                gold_rate_id: '',
                gold_rate: '',
                gold_weight: '',
                gold_value: '',
                item_density: '',
              },
            ]);
          }
        });

        setShowSectionStates({
          ...showSectionStates,
          itemSection: true,
          toggleRenewDraftBills: false,
        });
      }

      if (inputName === 'ddate') {
        if (cookie.get('user_roles') == 1) {
          setNewLoan({
            ...newLoan,
            ddate: inputValue,
            final_date: moment(inputValue)
              .add(additionalPawnData.months, 'months')
              .format('YYYY-MM-DD'),
            //   .format('MM/DD/YYYY'),
          });
        }
      }

      if (inputName === 'prev_bill_type') {
        setNewLoan({
          ...newLoan,
          prev_bill_type: inputValue,
        });

        const response = await api.get(
          `bill-count/${cookie.get('user_branch')}/${inputValue}`,
        );

        setAdditionalPawnData({
          ...additionalPawnData,
          maxPrevBillNum: response.data,
        });
      }

      if (inputName === 'prev_bill_no') {
        if (inputValue <= additionalPawnData.maxPrevBillNum) {
          setNewLoan({
            ...newLoan,
            prev_bill_no: inputValue,
          });
        } else {
          msg.error_stick(
            `Bill number for the selected bill type cannot exceed ${additionalPawnData.maxPrevBillNum}`,
          );
        }
      }

      if (inputName === 'payable_amount') {
        const stamp_fee = await selectStampFee(inputValue);
        const int_amounts = await calInterestAndAmount(
          inputValue,
          stamp_fee.fee,
        );

        /**
         * ! Pawning amount (required amount) is rounded to the next multiple of 5
         *
         * ! Calculation goes like following
         * * Payable Alount + (Payable Alount * FM Interest Rate / 100) + ((Payable Alount * FM Interest Rate / 100) * FM Interest Rate / 100) + Stamp Fee
         * * An interest for the first month interst is calculated again and added to the loan amount
         */

        // prettier-ignore
        const requiredOriginal = parseFloat(int_amounts.req_amount_original).toFixed(2);
        // prettier-ignore-end

        // prettier-ignore
        const required = parseFloat(int_amounts.req_amount).toFixed(2);
        // prettier-ignore-end

        let adj =
          parseFloat(required) -
          parseFloat(
            parseFloat(roundup.round(int_amounts.final_fm_interest)) +
              parseFloat(stamp_fee.fee) +
              parseFloat(inputValue),
          );

        if (adj < 0) {
          // * payable , 23
          setTransactionData([
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '1',
              amount: required,
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '11',
              amount: parseFloat(int_amounts.final_fm_interest),
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '10',
              amount: stamp_fee.fee,
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '23',
              amount: adj * -1,
              bill_extended_period: '4',
            },
          ]);
        } else {
          setTransactionData([
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '1',
              amount: required,
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '11',
              amount: parseFloat(int_amounts.final_fm_interest),
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '10',
              amount: stamp_fee.fee,
              bill_extended_period: '4',
            },
            {
              ref_no: additionalPawnData.refNo,
              ddate: newLoan.ddate,
              trans_type_id: '23',
              amount: adj,
              bill_extended_period: '4',
            },
          ]);
        }

        setNewLoan({
          ...newLoan,
          payable_amount: inputValue,
          required_amount: required,
          stamp_fee_id: stamp_fee.fee_id,
          interest_rate_id: int_amounts.rate_id,
        });

        setAdditionalPawnData({
          ...additionalPawnData,
          stamp_fee: roundup.round(stamp_fee.fee),
          fm_interest_rate: roundup.round(int_amounts.fm_interest_rate),
          nm_interest_rate: roundup.round(int_amounts.nm_interest_rate),
          first_month_interest: parseFloat(
            roundup.round(int_amounts.final_fm_interest),
          ).toFixed(2),
          next_month_interest: parseFloat(
            roundup.round(int_amounts.nm_interest),
          ).toFixed(2),
        });
        console.log(stamp_fee);
      }

      if (inputName === 'required_amount') {
        setNewLoan({
          ...newLoan,
          required_amount: inputValue,
        });
        if (newLoan.calculation_mode == 'BACKWARD') {
          console.log('bill type id : ' + billTypeSearch.bill_type_id);
          if (billTypeSearch.bill_type_id != '') {
            const results = await backwordCalculation.calculatePayableAmount(
              inputValue,
              stampFees,
              interestRates,
            );
            console.log('received response from new calcaulation');
            console.log(results);
            setAdditionalPawnData({
              ...additionalPawnData,
              fm_interest_rate: parseFloat(
                results.first_month_interest_rate,
              ).toFixed(2),
              nm_interest_rate: parseFloat(
                results.next_month_interest_rate,
              ).toFixed(2),
              first_month_interest: parseFloat(
                results.first_month_interest,
              ).toFixed(2),
              next_month_interest: parseFloat(
                results.next_month_interest,
              ).toFixed(2),
              stamp_fee: parseFloat(results.stamp_fee).toFixed(2),
            });
            setNewLoan({
              ...newLoan,
              required_amount: inputValue,
              payable_amount: parseFloat(results.required_amount_round_up),
              interest_rate_id: results.interest_rate_id,
              stamp_fee_id: results.stamp_fee_id,
              calculation_mode: 'BACKWARD',
            });
            let adj =
              parseFloat(results.required_amount_round_up) -
              parseFloat(results.required_amount_original);
            let final_adj = adj < 0 ? parseFloat(adj * -1) : adj;
            setTransactionData([
              {
                ref_no: additionalPawnData.refNo,
                ddate: newLoan.ddate,
                trans_type_id: '1',
                amount: inputValue,
                bill_extended_period: '4',
              },
              {
                ref_no: additionalPawnData.refNo,
                ddate: newLoan.ddate,
                trans_type_id: '11',
                amount: parseFloat(results.first_month_interest),
                bill_extended_period: '4',
              },
              {
                ref_no: additionalPawnData.refNo,
                ddate: newLoan.ddate,
                trans_type_id: '10',
                amount: parseFloat(results.stamp_fee).toFixed(2),
                bill_extended_period: '4',
              },
              {
                ref_no: additionalPawnData.refNo,
                ddate: newLoan.ddate,
                trans_type_id: '23',
                amount: final_adj,
                bill_extended_period: '4',
              },
            ]);
          }
        }
      }

      if (
        inputName === 'is_renew' ||
        inputName === 'approval_remarks' ||
        inputName === 'approving_officer'
      ) {
        setNewLoan({
          ...newLoan,
          [inputName]: inputValue,
        });
      }

      if (inputName === 'service_charge') {
        setNewLoan({
          ...newLoan,
          service_charge: inputValue,
        });
      }

      if (inputName === 'is_old_bill') {
        setNewLoan({
          ...newLoan,
          is_old_bill: inputValue,
        });
      }

      if (inputName === 'addition') {
        console.log('change additional amount : ' + inputValue);
        await calculateLoanAmount();
        setNewLoan({
          ...newLoan,
          // required_amount: total.toFixed(2),
          additional_fees: inputValue,
        });
        if (
          inputValue == 0 ||
          inputValue == NaN ||
          inputValue == undefined ||
          inputValue == ''
        ) {
          //
        } else {
          if (inputValue.length >= 2) {
            let total = 0;
            const subtract_value = inputValue.substring(0, 1);
            if (additionalPawnData.operation == 'plus') {
              total =
                parseFloat(inputValue) +
                parseFloat(newLoan.required_amount) -
                parseFloat(subtract_value);
            } else {
              total =
                parseFloat(newLoan.required_amount) -
                parseFloat(inputValue) +
                parseFloat(subtract_value);
              //
            }
            setNewLoan({
              required_amount: total.toFixed(2),
              additional_fees: inputValue,
            });
          } else {
            let total = 0;
            if (additionalPawnData.operation == 'plus') {
              total =
                parseFloat(inputValue) + parseFloat(newLoan.required_amount);
            } else {
              total =
                parseFloat(newLoan.required_amount) - parseFloat(inputValue);
            }
            setNewLoan({
              ...newLoan,
              required_amount: total.toFixed(2),
              additional_fees: inputValue,
            });
          }
        }
      }
    }
  };

  const calculateLoanAmount = async () => {
    const inputValue = newLoan.payable_amount;
    const stamp_fee = await selectStampFee(inputValue);
    const int_amounts = await calInterestAndAmount(inputValue, stamp_fee.fee);

    /**
     * ! Pawning amount (required amount) is rounded to the next multiple of 5
     *
     * ! Calculation goes like following
     * * Payable Alount + (Payable Alount * FM Interest Rate) + ((Payable Alount * FM Interest Rate) * FM Interest Rate) + Stamp Fee
     * * An interest for the first month interst is calculated again and added to the loan amount
     */

    // prettier-ignore
    const requiredOriginal = parseFloat(int_amounts.req_amount_original).toFixed(2);
    // prettier-ignore-end

    // prettier-ignore
    const required = parseFloat(int_amounts.req_amount).toFixed(2);
    // prettier-ignore-end

    console.log('original : ' + requiredOriginal + ' required : ' + required);
    console.log(
      'adjusment : ' + (parseFloat(required) - parseFloat(requiredOriginal)),
    );

    setTransactionData([
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '1',
        amount: required,
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '11',
        amount: parseFloat(int_amounts.final_fm_interest),
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '10',
        amount: stamp_fee.fee,
        bill_extended_period: '4',
      },
      {
        ref_no: additionalPawnData.refNo,
        ddate: newLoan.ddate,
        trans_type_id: '23',
        amount: parseFloat(required) - parseFloat(requiredOriginal),
        bill_extended_period: '4',
      },
    ]);

    setNewLoan({
      ...newLoan,
      payable_amount: inputValue,
      required_amount: required,
      stamp_fee_id: stamp_fee.fee_id,
      interest_rate_id: int_amounts.rate_id,
    });

    // prettier-ignore
    // setAdditionalPawnData({
    //   ...additionalPawnData,
    //   stamp_fee: parseFloat(stamp_fee.fee).toFixed(2),
    //   fm_interest_rate: parseFloat(int_amounts.fm_interest_rate).toFixed(2),
    //   nm_interest_rate: parseFloat(int_amounts.nm_interest_rate).toFixed(2),
    //   first_month_interest: parseFloat(int_amounts.final_fm_interest).toFixed(2),
    //   next_month_interest: parseFloat(int_amounts.nm_interest).toFixed(2),
    // });

    setAdditionalPawnData({
            ...additionalPawnData,
            stamp_fee: roundup.round(stamp_fee.fee),
            fm_interest_rate: roundup.round(int_amounts.fm_interest_rate),
            nm_interest_rate: roundup.round(int_amounts.nm_interest_rate),
            first_month_interest: parseFloat(roundup.round(int_amounts.final_fm_interest)).toFixed(2),
            next_month_interest: parseFloat(roundup.round(int_amounts.nm_interest)).toFixed(2),
        });
  };

  const checkInputIsInteger = async (e) => {
    e = e ? e : window.event;
    var charCode = e.which ? e.which : e.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode !== 46) {
      e.preventDefault();
    } else {
      return true;
    }
  };

  const checkMobileNumber = async (e) => {
    e = e ? e : window.event;
    var charCode = e.which ? e.which : e.keyCode;
    if (
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      charCode !== 46 &&
      charCode !== 44
    ) {
      e.preventDefault();
    } else {
      return true;
    }
  };

  const selectStampFee = async (inputValue) => {
    let fee = 0;
    let fee_id = 0;
    stampFees.map((stampFee) => {
      if (
        parseFloat(stampFee.from_value) <= parseFloat(inputValue) &&
        parseFloat(inputValue) <= parseFloat(stampFee.to_value)
      ) {
        fee = parseFloat(stampFee.stamp_fee);
        fee_id = stampFee.id;
      }
    });
    return { fee_id, fee };
  };

  const calInterestAndAmount = async (inputValue, stampFee) => {
    let rate_id = 0;
    let fm_interest = 0; // First month interest
    let nm_interest = 0; // Interest from the second month
    let fm_interest_rate = 0; // First month interest rate
    let nm_interest_rate = 0; // Interest from the second month rate
    let extra_interest = 0; // Dat extra interest taken unfairly from customers
    let final_fm_interest = 0; // Interest for the bill amount (NOT the capital) after even taking the extra interest. Low key theives 💰
    let req_amount = 0; //
    let req_amount_original = 0; //

    interestRates.map((rates) => {
      if (
        parseFloat(rates.from_amount) <= parseFloat(inputValue) &&
        parseFloat(inputValue) <= parseFloat(rates.to_amount)
      ) {
        fm_interest_rate = parseFloat(rates.fm_interest_rate);
        nm_interest_rate = parseFloat(rates.nm_interest_rate);
        rate_id = rates.id;
      }
    });

    // fm_interest = Math.ceil(
    //   (parseFloat(inputValue) * parseFloat(fm_interest_rate)) / 100,
    // );
    fm_interest = (parseFloat(inputValue) * parseFloat(fm_interest_rate)) / 100;

    // prettier-ignore
    // extra_interest = Math.ceil((parseFloat(fm_interest) * parseFloat(fm_interest_rate)) / 100);
    // console.log('extra interest : '+extra_interest);
    extra_interest = (parseFloat(fm_interest) * parseFloat(fm_interest_rate)) / 100;

    // prettier-ignore
    /* enterest calculate to stampFee // 2022-01-20 */
    // let stamp_fee_interest = Math.ceil((parseFloat(stampFee) * parseFloat(fm_interest_rate)) / 100);
    let stamp_fee_interest = (parseFloat(stampFee) * parseFloat(fm_interest_rate)) / 100;

    // prettier-ignore
    req_amount_original = parseFloat((
            parseFloat(inputValue) + 
            parseFloat(fm_interest) + 
            parseFloat(extra_interest) + 
            parseFloat(stampFee) + 
            parseFloat(stamp_fee_interest)
        )).toFixed(2);
    // prettier-ignore-end

    // prettier-ignore
    req_amount = await roundup.pawning(parseFloat(inputValue) + parseFloat(fm_interest) + parseFloat(extra_interest) + parseFloat(stampFee) + stamp_fee_interest);
    // prettier-ignore-end

    // prettier-ignore
    final_fm_interest = parseFloat(parseFloat(req_amount) * parseFloat(fm_interest_rate)) / 100;

    nm_interest = (parseFloat(req_amount) * parseFloat(nm_interest_rate)) / 100;

    const new_intrest = await interestCalculator.finalInterest(
      inputValue,
      fm_interest_rate,
      stampFee,
      nm_interest_rate,
    );
    req_amount = new_intrest.roundup_amount;
    req_amount_original = new_intrest.required_amount;
    fm_interest = new_intrest.final_int;
    nm_interest = new_intrest.other_month_int;
    final_fm_interest = new_intrest.final_int;

    return {
      fm_interest_rate, // *
      nm_interest_rate, // *
      rate_id, // *
      fm_interest,
      nm_interest,
      extra_interest,
      final_fm_interest,
      req_amount,
      req_amount_original,
    };
  };

  const handleRenewValueChanges = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    if (inputName === 'new_bill_type_id') {
      try {
        setIsLoading({
          ...isLoading,
          newBillno: true,
        });

        const response = await api.get(
          `bill-count/${cookie.get('user_branch')}/${inputValue}`,
        );

        setRenewData({
          ...renewData,
          newBillTypeId: inputValue,
          newBillno: parseInt(response.data) + parseInt(1),
        });

        billTypes.forEach(async (bill) => {
          if (parseInt(bill.id) === parseInt(inputValue)) {
            setAdditionalRenewData({
              ...additionalRenewData,
              newDuration: bill.period.des,
              newMonths: bill.period.months,
              newFinalDate: moment(newLoan.ddate)
                .add(bill.period.months, 'months')
                .format('YYYY-MM-DD'),
              newGoldRates: bill.gold_rate,
              newInterestrates: bill.int_rate,
            });
          }
        });
      } catch (error) {
        msg.error('Unable to fetch bill count');
      } finally {
        setIsLoading({
          ...isLoading,
          newBillno: false,
        });
      }
    }
  };

  // Validate data prior to saving
  const validator = async () => {
    let state = true;
    let message = '';

    if (customer.nic.length < 9) {
      state = false;
      message = 'Type minimum 9 characters for NIC.';
    }
    // if (customer.title == '') {
    //   state = false;
    //   message = 'Select Customer Title.';
    // }
    if (customer.name == '') {
      state = false;
      message = 'Customer name cannot be empty';
    }
    if (customer.name.length < 5) {
      state = false;
      message = 'Type minimum 5 characters for Customer Name.';
    }
    if (customer.address_1 == '' || customer.address_2 == '') {
      state = false;
      message = `Customer's address cannot be empty`;
    }
    if (customer.telephone == '') {
      state = false;
      message = `Customer's telephone number cannot be empty`;
    }

    return {
      state: state,
      message: message,
    };
  };

  const handleSubmit = async () => {
    if (cancelOldBill == false) {
      console.log('original pwn');
      if (isOldPawning == false) {
        const validated = await validator();
        if (validated.state) {
          // const response_count = await api.get(
          //   `getCustomerBillCounts/${customer.id}`,
          // );
          let second_value =
            newLoan.calculation_mode == 'FORWARD'
              ? parseFloat(newLoan.required_amount)
              : parseFloat(newLoan.payable_amount);
          if (parseFloat(newLoan.gold_value) < parseFloat(second_value)) {
            setShowSectionStates({
              ...showSectionStates,
              approvalConfirmation: true,
            });
            // } else if (response_count.data == 0) {
            //   setShowSectionStates({
            //     ...showSectionStates,
            //     approvalConfirmationcuslimit: true,
            //   });
          } else {
            setControlDisabledStates({
              ...controlDisabledStates,
              saveButton: false,
            });
            await save();
            const redirectUrl =
              '/new-loans/:branch_id/:bill_type_id/:bill_no/:bill_type';
            navigate(redirectUrl);
            resetAll();
          }
        } else {
          msg.error(validated.message);
          setControlDisabledStates({
            ...controlDisabledStates,
            saveButton: true,
          });
          return;
        }
      }
    } else {
      try {
        setDisabledSaveBtn(true);
        const response = await api.post('recall-cancel-pawning').values({
          selected_id: cancelBillId,
          branch_id: cookie.get('user_branch'),
        });
        if (response.status == 200 && response.data.status == 200) {
          msg.success('Cancel Bill Successfull');
          resetAll();
          print.pawningBill(response.data.data, 0, 0, [], 'CANCEL');
        } else if (response.status == 200 && response.data.status == 403) {
          msg.success('No Access to Save Loan');
          resetAll();
        } else {
          msg.error('Error when cancel');
        }
      } catch (error) {
        console.log(error);
        msg.error('Something Went Wrong!');
      }
    }
  };

  const handleRenewSubmit = () => {
    msg.info_stick(
      `\u{1F6A7} Sorry! We're doing some work on this feature at the moment \u{1F6A7}`,
    );
  };

  const approvalConfirmation = async (isApproved) => {
    if (newLoan.approving_officer == '') {
      msg.error(`Approval officer required.`);
      return;
    }
    // if (newLoan.approval_remarks == '') {
    //   msg.error(`Approval remarks required.`);
    //   return;
    // }
    setDisableSendApproveButton(true);
    if (isApproved) await sendToOverAdvanceApproval();
    else resetAll();
  };

  const sendToOverAdvanceApproval = async () => {
    try {
      const response = await api
        .post('sendApproveRequestCustOverAdvance')
        .values({
          customerInfo: customer,
          loan: newLoan,
          loan_items: pawningItems,
          loan_trans: transactionData,
          oldbilltype: loadBillTypeForApproval,
        });
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      console.log('after sent approvel');
      console.log(response);
      setApprovalRefNo(response.data);
      //   const number = response.data.approvel_number;
      //     setApprovelNumber(
      //         ...approvelNummber,
      //         number
      //     );
      //   console.log('Received : ' + response.data.approvel_number);
      //   console.log('After Assigning : ' + approvelNummber);

      // setShowTimerModal(true);
      setShowSectionStates({
        ...showSectionStates,
        approvalConfirmation: false,
        timerModal: true,
      });

      checkOverAdvanceApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
    }
  };

  const approvalConfirmationcuslimit = async (isApproved) => {
    if (isApproved == true) {
      if (newLoan.approving_officer == '') {
        msg.error(`Approval officer required.`);
        return;
      }
      // if (newLoan.approval_remarks == '') {
      //   msg.error(`Approval remarks required.`);
      //   return;
      // }
      // setDisableSendApproveButtonCust(true);
      // if (isApproved) await sendToCustomerApproval();
      else resetAll();
    } else {
      setShowSectionStates({
        ...showSectionStates,
        approvalConfirmationcuslimit: false,
        approvalConfirmation: false,
        timerModalCusLimit: false,
        toggleRenewDraftBills: false,
        itemSection: true,
      });
      resetAll();
    }
  };

  const sendToCustomerApproval = async (cusId, allowedBills) => {
    //prettier-ignore
    try {
      console.log('clear');
      const response = await api.post('sendCustReleaseRequset').values({
        // customer_id: cusId,
        customer_id: cusId,
        allowed_bills: allowedBills,
        branch_id: cookie.get('user_branch'),
        user_id: cookie.get('user_id'),
      });

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      setApprovalRefNo(response.data);

      // setShowTimerModal(true);
      setShowSectionStates({
        ...showSectionStates,
        approvalConfirmationcuslimit: false,
        approvalConfirmation: false,
        timerModalCusLimit: true,
        toggleRenewDraftBills:false,
        itemSection:true
      });

      checkCustomerApprovalStatus(response.data);
    } catch (error) {
      msg.error(error);
    }
    //prettier-ignore-end
  };

  const endTimer = () => {
    // setShowTimerModal(false);
    setShowSectionStates({
      ...showSectionStates,
      timerModal: false,
    });

    removeExpiredLoanApprovals();
    // resetAll();
    msg.info('Please contact the admin for approval');
    setDisableSendApproveButton(false);
  };

  const endTimerCusLimit = () => {
    // setShowTimerModal(false);
    setShowSectionStates({
      ...showSectionStates,
      timerModalCusLimit: false,
    });
    removeExpiredLoanApprovals();
    resetAll();
    msg.info('Please contact the admin for approval');
    setDisableSendApproveButtonCust(false);
  };

  const removeExpiredLoanApprovals = async () => {
    try {
      const response = await api
        .post('loanApprovalExpire')
        .values({ loan: newLoan, approvalRefNo: approvalRefNo });
    } catch (error) {
      msg.error(error);
      return;
    }
  };

  const save = async () => {
    let bill_type_name = '';
    let bill_number = '';
    let status = 'NEW';
    if (Object.keys(newLoan.draft_bill_details).length > 0) {
      const bill_type = await api.get(
        'bill-type-details/' + newLoan.draft_bill_details.bill_type_id,
      );
      bill_type_name = bill_type.data.des;
      bill_number = newLoan.draft_bill_details.bill_no;
      status = 'RENEW';
    }
    if (isEdit == true) {
      if (allowEditItems == false) {
        setDisabledSaveBtn(true);
        const response = await api.post('updateLoanCustomer').values({
          loan: newLoan,
          customerInfo: customer,
        });
        if (response.status == 200) {
          if (response.data.status == 200) {
            msg.success('Customer Updated Successfully !!');
            print.pawningBill(
              response.data.data,
              0,
              0,
              [bill_type_name, bill_number],
              status,
            );
            resetAll();
          } else if (response.data.status == 403) {
            msg.warning('Access Denied !!');
          } else {
            msg.error('Customer Updated Error !!');
          }
        } else {
          msg.error('Customer Updated Error !!');
        }
      }
      if (allowEditItems == true) {
        // * update pawning
        await updatePawning();
        resetAll();
      }
    } else {
      try {
        setDisabledSaveBtn(true);
        const response = await api.post('newReLoanSave').values({
          loan: newLoan,
          loan_items: pawningItems,
          loan_trans: transactionData,
          customerInfo: customer,
          isManualBillNo: isManualBillNo,
        });
        msg.info(response.data.message);
        if (response.error) {
          Object.values(response.error).forEach((err) => {
            msg.error(err[0]);
          });
          return;
        }

        if (response.data.errMessage) {
          msg.error(`${response.data.errMessage}`);
        } else {
          msg.info(response.message);
          // if(cookie.get('new_date') === moment().format(`YYYY-MM-DD`)){
          print.pawningBill(
            response.data,
            0,
            0,
            [bill_type_name, bill_number],
            status,
          );
          // }
          msg.success(
            `Bill no ${response.data[0].bill_type.des} - ${response.data[0].bill_no}updatePawning saved successfully`,
          );
          // console.log('redirect url');
          // const redirectUrl =
          //   '/new-rloans/:branch_id/:bill_type_id/:bill_no/:bill_type';
          // history.push(redirectUrl);
          resetAll();

          // setControlDisabledStates({})
          // controlDisabledStates.items.addItems ||
          setAllowEditItems(true);
        }
      } catch (error) {
        setDisabledSaveBtn(false);
        msg.error(error);
        return;
      }
    }
    setIsEdit(false);
  };

  const reprintPawningBill = async () => {
    let bill_type_name = '';
    let bill_number = '';
    // if (isCancelBill == false) {
    const permission_to_reprint = await api.get(
      `check-if-role-has-reprint-permission/${cookie.get('user_roles')}/loan`,
    );
    if (
      permission_to_reprint.status == 200 &&
      permission_to_reprint.data.status == 200
    ) {
      // console.log(permission_to_reprint);
      if (permission_to_reprint.data.data > 0) {
        try {
          const response = await api.get(`show-loan-by-id/${newLoan.id}`);
          bill_type_name = response.data[0].old_bill_type_num;
          bill_number = response.data[0].old_bill_num;
          if (response.data.message) {
            msg.error(`${response.data.message}`);
          } else {
            msg.success(`Done`);
            console.log(response.data);

            print.pawningBill(
              response.data,
              1,
              0,
              [bill_type_name, bill_number],
              'REPRINT',
            );
          }
        } catch (error) {
          msg.error(error);
        }
      } else {
        msg.warning('No Permission to Reprint Bill ...');
      }
    } else {
      msg.error('Permission Loading Error ...');
    }
    // }
  };

  const updatePawning = async () => {
    let bill_type_name = '';
    let bill_number = '';
    if (isCancelBill == false) {
      try {
        setDisabledUpdateBtn(true);
        const response = await api.post('updatePawning').values({
          customer: customer,
          loan: newLoan,
          loan_items: pawningItems,
          loan_trans: transactionData,
        });
        const response_renewe = await api.get(`show-loan-by-id/${newLoan.id}`);
        bill_type_name = response_renewe.data[0].old_bill_type_num;
        bill_number = response_renewe.data[0].old_bill_num;
        if (response.status == 200) {
          if (response.data.status == 200) {
            msg.success('Update Pawning ');
            resetAll();

            print.pawningBill(
              response.data.data,
              0,
              0,
              [bill_type_name, bill_number],
              'CANCEL',
            );
          } else {
            msg.error('Updating Error');
          }
        } else {
          resetAll();
          msg.error('Connection Error');
        }
      } catch (error) {
        setDisabledUpdateBtn(false);
        msg.error(error);
      }
    }
  };

  const addNewItem = () => {
    new Promise((resolve, reject) => {
      let status = 0;
      if (pawningItems.length) {
        pawningItems.forEach((item) => {
          console.log('pawning items');
          console.log(item);
          if (item.gold_value && item.gold_value != 0) {
            if (item.gold_weight && item.gold_weight != 0) {
              if (item.qty && item.qty != 0) {
                if (item.category_id) {
                  if (item.item_condition_id) {
                    resolve();
                  } else {
                    msg.warning(`Item condition cannot be empty!`);
                    reject();
                  }
                } else {
                  msg.warning(`Item category cannot be empty!`);
                  reject();
                }
              } else {
                msg.warning(`Item quantity cannot be empty or zero!`);
                reject();
              }
            } else {
              msg.warning(`Gold weight cannot be empty or zero!`);
              reject();
            }
          } else {
            // msg.warning(`Gold values cannot be empty or zero!`); // Commented on 2022-08-02 as per request by Mis. Malathi.
            reject();
          }
        });
      }
    })
      .then(() => {
        setPawningItems([
          ...pawningItems,
          {
            index: uuidv4(),
            category_id: '',
            items: [],
            item_id: '',
            qty: '',
            item_condition_id: '',
            condition_note: '',
            gold_rate_id: '',
            gold_rate: '',
            gold_weight: '',
            gold_value: '',
            item_density: '',
          },
        ]);
      })
      .catch(() => {
        return;
      });
  };

  const removeItem = (i) => {
    // TODO: Create a better dialog box component... Use the FormModal component as a base template
    if (window.confirm('Are you sure you want to remove this item?')) {
      setPawningItems(pawningItems.filter((item) => item.index !== i));

      setTimeout(() => {
        if (pawningItems.length === 1) {
          setPawningItems([
            {
              index: uuidv4(),
              category_id: '',
              items: [],
              item_id: '',
              qty: '',
              item_condition_id: '',
              condition_note: '',
              gold_rate_id: '',
              gold_rate: '',
              gold_weight: '',
              gold_value: '',
              item_density: '',
            },
          ]);
        }
      }, 200);
    }
  };

  const renew = async () => {
    // prettier-ignore
    if (window.confirm(`Are you sure you want re-new this pawning? NOTE: This will redeem this pawning and add new one under a new bill number`)) {
      setShowSectionStates({
        ...showSectionStates,
        quickRenewModal: true,
      });
      // try {
      //   const response = await api.post('renewPawning').values({
      //     loan_id: loanId,
      //   });

      //   if (response.error) {
      //     Object.values(response.error).forEach((err) => {
      //       msg.error(err[0]);
      //     });
      //     return;
      //   }

      //   msg.success(response.data);
      // } catch (error) {
      //   msg.error(error);
      // }
    }
    // prettier-ignore-end
  };

  const [cancelPawningApprovel, setCancelPawningApprovel] = useState(false);

  const checkOverAdvanceApprovalStatus = async (approval_id) => {
    //prettier-ignore
    if (cancelPawningApprovel == false) {}
    const checkStatus = setInterval(async () => {
      if (cancelPawningApprovel == false) {
        const response = await api.get(
          `showOverAdvanceApprovalStatus/${approval_id}`,
        );

        if (!response.data.length) {
          // console.log(approvelNummber);
          const reason = await api.get(
            'rejectApprovelReason/' +
              newLoan.branch_id +
              '/' +
              newLoan.bill_count +
              '/' +
              newLoan.bill_type_id,
          );

          // if (reason.status == 200) {
          setShowSectionStates({
            ...showSectionStates,
            timerModal: false,
          });
          toggleApprovalConfirmation(false);
          setDisableSendApproveButton(false);
          if (reason.data.reject_reason != undefined) {
            msg.warning_stick(
              `Your request appears to be rejected. Please contact the admin. Reason : ${reason.data.reject_reason.description}`,
            );
          }
          // }

          // resetAll();

          clearInterval(checkStatus);
        } else if (response.data[0].status === 'APPROVED') {
          // setShowTimerModal(false);
          setShowSectionStates({
            ...showSectionStates,
            timerModal: false,
            approvalConfirmation: false,
            toggleRenewDraftBills: false,
            itemSection: true,
          });
          msg.success(`Your request have been approved`);

          const response_count = await api.get(
            `getCustomerBillCounts/${customer.id}`,
          );
          await save();
          resetAll();

          clearInterval(checkStatus);
        }
      }
    }, 30000);
    //prettier-ignore-end

    setTimeout(() => {
      clearInterval(checkStatus);
    }, 300000);
  };

  const checkCustomerApprovalStatus = async (approval_id) => {
    const checkStatus = setInterval(async () => {
      const response = await api.get(
        `showCustomerApprovalStatus/${approval_id}`,
      );

      if (response.data[0]) {
        if (response.data[0].status === 'APPROVED') {
          // setShowTimerModal(false);
          setShowSectionStates({
            ...showSectionStates,
            // timerModal: false,
            timerModalCusLimit: false,
            approvalConfirmationcuslimit: false,
            approvalConfirmation: false,
            toggleRenewDraftBills: false,
            itemSection: true,
          });
          clearInterval(checkStatus);
          msg.success_stick(`Your request have been approved.`);
          //  await save();
          //resetAll();
        }
      } else {
        // setShowTimerModal(false);
        setShowSectionStates({
          ...showSectionStates,
          timerModalCusLimit: false,
          // timerModal: false,
          approvalConfirmationcuslimit: false,
        });
        clearInterval(checkStatus);
        msg.info_stick('Your approval request was rejected!');
        resetAll();
      }
    }, 30000);

    setTimeout(() => {
      clearInterval(checkStatus);
    }, 300000);
  };

  const approvalTimerText = ({ remainingTime }) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return (
      <div className="container text-center">
        <div className="text-muted">Remaining</div>
        <div className="h2">
          {`
            ${('0' + minutes).slice(-2)}
            :
            ${('0' + seconds).slice(-2)}
          `}
        </div>
        <div className="text-muted">minutes</div>
      </div>
    );
  };

  // const printBill = (billData) => {
  // };

  const toggleCustomerSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      customerSection: !showSectionStates.customerSection,
    });
  };

  const toggleItemsSection = () => {
    setShowSectionStates({
      ...showSectionStates,
      itemSection: !showSectionStates.itemSection,
    });
  };

  const toggleTrasHistorySection = () => {
    setShowSectionStates({
      ...showSectionStates,
      transHistorySection: !showSectionStates.transHistorySection,
    });
  };

  const toggleQuickRenewModal = () => {
    setShowSectionStates({
      ...showSectionStates,
      quickRenewModal: !showSectionStates.quickRenewModal,
    });
  };

  const toggleApprovalConfirmation = () => {
    setShowSectionStates({
      ...showSectionStates,
      approvalConfirmation: !showSectionStates.approvalConfirmation,
    });
  };

  const toggleApprovalConfirmationcuslimit = () => {
    setShowSectionStates({
      ...showSectionStates,
      approvalConfirmationcuslimit:
        !showSectionStates.approvalConfirmationcuslimit,
    });
    resetAll();
  };

  const viewOldItems = (items) => {
    setLoanHistory({
      ...loanHistory,
      loanItems: items,
    });
    setShowSectionStates({
      ...showSectionStates,
      oldPawningItems: true,
    });
  };

  const toggleOldItemsModal = () => {
    if (showSectionStates.oldPawningItems) {
      setLoanHistory({
        ...loanHistory,
        loanItems: [],
      });
    }

    setShowSectionStates({
      ...showSectionStates,
      oldPawningItems: !showSectionStates.oldPawningItems,
    });
  };

  const toggleTransHistoryModal = async (type) => {
    if (showSectionStates.historyModal === false) {
      if (type === 'redeem') {
        setIsLoading({
          ...isLoading,
          history: true,
        });

        try {
          const response = await api.get(`showRedeemHistory/${customer.id}`);

          setLoanHistory({
            ...loanHistory,
            redeems: response.data[0].redeem,
          });
        } catch (error) {
          msg.error('Unable to fetch redeem data!');
        } finally {
          setIsLoading({
            ...isLoading,
            history: false,
          });
        }
      } else {
        setIsLoading({
          ...isLoading,
          history: true,
        });

        try {
          const response = await api.get(`showOtherHistory/${customer.id}`);

          setLoanHistory({
            ...loanHistory,
            others: response.data[0].other,
          });
        } catch (error) {
          msg.error('Unable to fetch data!');
        } finally {
          setIsLoading({
            ...isLoading,
            history: false,
          });
        }
      }
    }

    setShowSectionStates({
      ...showSectionStates,
      historyModal: !showSectionStates.historyModal,
      historyModalType: type,
    });
  };

  const changeRadioButton = async (e) => {
    setAdditionalPawnData({
      ...additionalPawnData,
      operation: e.target.value,
    });
    setNewLoan({
      ...newLoan,
      operation: e.target.value,
    });
  };

  const HistoryDetails = ({ type }) => {
    if (type === 'redeem') {
      return (
        <div
          className="table-responsive"
          style={{
            height: '300px',
            overflowY: 'auto',
          }}
        >
          <table
            className="table table-bordered table-sm"
            style={{
              borderCollapse: 'separate',
              borderSpacing: '0 2px',
            }}
          >
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Branch</th>
                <th scope="col">Bill Type</th>
                <th scope="col">No</th>
                <th scope="col">Pawning Date</th>
                <th scope="col">Gold Weight</th>
                <th scope="col">Loan Amount</th>
                <th scope="col">Redeem Date</th>
                <th scope="col">Redeem Amount</th>
                {/* <th scope="col">State</th> */}
              </tr>
            </thead>
            <tbody>
              {loanHistory.redeems ? (
                loanHistory.redeems.map((redeem, index) => {
                  return (
                    <>
                      <tr key={redeem.id}>
                        <td rowSpan="2">{index + 1}</td>
                        <td>{redeem.branch.name}</td>
                        <td>{redeem.bill_type.des}</td>
                        <td>{redeem.bill_no}</td>
                        <td>{redeem.ddate}</td>
                        <td className="text-right">{redeem.total_weight}</td>
                        <td className="text-right">{redeem.required_amount}</td>
                        <td>
                          {moment(redeem.created_at).format('DD-MM-YYYY')}
                        </td>
                        <td className="text-right">{redeem.redeem_amount}</td>
                        {/* <td>{loan.state}</td> */}
                      </tr>
                      <tr className="table-warning">
                        <td className="text-center">--- ITEMS ---</td>
                        <td colSpan="7">
                          <table className="table table-sm">
                            <thead className="thead-light">
                              <tr>
                                <th scope="col">#</th>
                                <th scope="col">Item</th>
                                <th scope="col">Condition</th>
                                <th scope="col">KT</th>
                                <th scope="col">Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {redeem.loan_item ? (
                                redeem.loan_item.map((item, index) => {
                                  return (
                                    <tr key={item.id}>
                                      <td>{index + 1}</td>
                                      <td>{item.item.name}</td>
                                      <td>{item.condition.description}</td>
                                      <td>
                                        {item.gold_rate.gold_types.category}
                                      </td>
                                      <td>{item.qty}</td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan="7" className="text-center">
                                    No data
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div
          className="table-responsive"
          style={{
            height: '300px',
            overflowY: 'auto',
          }}
        >
          <table
            className="table table-bordered table-sm"
            style={{
              borderCollapse: 'separate',
              borderSpacing: '0 2px',
            }}
          >
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Branch</th>
                <th scope="col">Bill Type</th>
                <th scope="col">No</th>
                <th scope="col">Pawning Date</th>
                <th scope="col">Gold Weight</th>
                <th scope="col">Final Redeem Amount</th>
                <th scope="col">Forfieted Date</th>
              </tr>
            </thead>
            <tbody>
              {loanHistory.others ? (
                loanHistory.others.map((other, index) => {
                  return (
                    <>
                      <tr key={other.id}>
                        <td rowSpan="2">{index + 1}</td>
                        <td>{other.branch.name}</td>
                        <td>{other.bill_type.des}</td>
                        <td>{other.bill_no}</td>
                        <td>{other.ddate}</td>
                        <td className="text-right">{other.total_weight}</td>
                        <td className="text-right">
                          {other.required_redeem_amount}
                        </td>
                        <td>{moment(other.created_at).format('DD-MM-YYYY')}</td>
                      </tr>
                      <tr className="table-warning">
                        <td className="text-center">--- ITEMS ---</td>
                        <td colSpan="6">
                          <div>
                            <table className="table table-sm">
                              <thead className="thead-light">
                                <tr>
                                  <th scope="col">#</th>
                                  <th scope="col">Item</th>
                                  <th scope="col">Condition</th>
                                  <th scope="col">KT</th>
                                  <th scope="col">Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {other.loan_item ? (
                                  other.loan_item.map((item, index) => {
                                    return (
                                      <tr key={item.id}>
                                        <td>{index + 1}</td>
                                        <td>{item.item.name}</td>
                                        <td>{item.condition.description}</td>
                                        <td>
                                          {item.gold_rate.gold_types.category}
                                        </td>
                                        <td>{item.qty}</td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan="6" className="text-center">
                                      No data
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  const resetAll = async () => {
    setLoadNewBill(false);
    setEnablechangeCustomer(true);
    setIsRedeemBillRenew(false);
    setCancelOldBill(false);
    setAllowChangeBillTypeWithoutChangeItems(false);
    setCancelBills([]);
    setRenewDraftBills([]);
    setIsCancelBill(false);
    setIsRenewalPawning(false);
    setAllowEditItems(true);
    setIsEdit(false);
    setNicChanged(false);
    setDisablenic(false);
    const trans_date = await api.get('trans_date/' + cookie.get('user_branch'));
    setNewLoan({
      branch_id: cookie.get('user_branch'),
      //   ddate: moment().format(`YYYY-MM-DD`),
      ddate: trans_date.data ? trans_date.data : moment().format(`YYYY-MM-DD`),
      final_date: '',
      total_weight: (0).toFixed(2),
      gold_value: (0).toFixed(2),
      required_amount: (0).toFixed(2),
      payable_amount: '',
      customer_id: '',
      bill_type_id: '',
      bill_count: '',
      interest_rate_id: '',
      stamp_fee_id: '',
      remd_letr_no: '0',
      is_renew: false,
      prev_bill_type: '',
      prev_bill_no: '',
      user: cookie.get('user_id'),
      status: 'PENDING',
      approval_remarks: '',
      approving_officer: '',
      is_old_bill: false,
      ref_no: '',
      additional_fees: 0,
      created_at: moment().format(`YYYY-MM-DD | HH:MM`),
      updated_at: moment().format(`YYYY-MM-DD | HH:MM`),
      stat: '',
      old_bill_type_id: '',
      old_bill_no: '',
      draft_bill_details: [],
      calculation_mode: 'FORWARD',
      prev_ref_no: '',
    });

    // setCalculationMode('FORWARD');

    setDisableSendApproveButton(false);

    setCustomer({
      branch_id: cookie.get('user_branch'),
      nic: '',
      old_nic: '',
      id: '',
      name: '',
      other_names: '',
      address_1: '',
      address_2: '',
      telephone: '',
      telephone_2: '',
      notes: '',
      allowed_bills: '',
      is_blacklisted: false,
    });

    setPawningItems([]);

    setTransactionData([]);

    setLoanHistory({
      loans: [],
      loanItems: [],
      redeems: [],
      others: [],
      pawning_count: 0,
      redeem_count: 0,
      other_count: 0,
      redeemed_total: 0,
      pawning_total: 0,
    });

    setAdditionalPawnData({
      duration: '',
      months: 0,
      fm_interest_rate: (0).toFixed(2),
      nm_interest_rate: (0).toFixed(2),
      first_month_interest: (0).toFixed(2),
      next_month_interest: (0).toFixed(2),
      stamp_fee: (0).toFixed(2),
      maxPrevBillNum: 0,
      refNo: '',
      isRedeemed: false,
      additional_fees: 0,
      operation: 'plus',
      ref_no: '',
    });

    setIsLoading({
      ...isLoading,
      init: false,
    });

    // setShowTimerModal(false);

    setShowSectionStates({
      customerSection: true,
      itemSection: false,
      transHistorySection: true,
      timerModal: false,
      timerModalCusLimit: false,
      historyModal: false,
      historyModalType: 'items',
      quickRenewModal: false,
      oldPawningItems: false,
      approvalConfirmation: false,
      approvalConfirmationcuslimit: false,
      toggleCancelBills: false,
      toggleRenewDraftBills: false,
    });

    setCustomerNic('');

    setRenewData({
      branch_id: cookie.get('user_branch'),
      oldLoanId: '',
      newBillTypeId: '',
      newBillno: '',
      newAmount: '',
      newPawningDate: moment().format(`YYYY-MM-DD`),
    });

    setAdditionalRenewData({
      newDuration: '',
      newMonths: '',
      newFinalDate: '',
      newGoldRates: [],
      newInterestrates: [],
    });

    setControlDisabledStates({
      customer: {
        nic: false,
        title: true,
        oldNic: true,
        name: true,
        otherName: true,
        postalAddress: true,
        nicAddress: true,
        telephone: true,
        notes: true,
      },
      billType: {
        billType: false,
        billNo: false,
        pawningDate: false,
      },
      items: {
        category: false,
        item: false,
        condition: false,
        type: false,
        densimeter: false,
        count: false,
        weight: false,
        removeItem: false,
        addItems: false,
        collapse: true,
      },
      loan: {
        payableAmount: false,
        requiredAmount: false,
        isRenewal: false,
        renewalBillNo: false,
        //  isOldBill: false,
      },
      saveButton: true,
    });

    // fetchData()

    setIsExistingCustomer('not-loaded');
    setDisabledSaveBtn(false);
    setDisabledUpdateBtn(false);
  };

  const closeApprovelRequest = async (id) => {
    if (id) {
      const response = await api.post('remove-approvel-request').values({
        id: id,
      });

      if (response.status == 200) {
        if (response.data.status == 200) {
          setShowSectionStates({
            ...showSectionStates,
            approvalConfirmation: false,
            timerModal: false,
          });
          msg.success('Remove Approvel Successfully !!');
          // resetAll();
        } else if (response.data.status == 401) {
          msg.warning('Already Approved !!');
        } else {
          msg.error('Approvel Removing Error !!');
        }
      } else {
        msg.error('Server Error');
      }
    }
  };

  const closeApprovelRequestCusLimit = async (id) => {
    if (id) {
      const response = await api
        .post('remove-custlimit-approvel-request')
        .values({
          id: id,
        });

      if (response.status == 200) {
        if (response.data.status == 200) {
          setShowSectionStates({
            ...showSectionStates,
            approvalConfirmationcuslimit: false,
            // timerModal: false,
            timerModalCusLimit: false,
          });
          msg.success('Remove Approvel Successfully !!');
          resetAll();
        } else if (response.data.status == 401) {
          msg.warning('Already Approved !!');
        } else {
          msg.error('Approvel Removing Error !!');
        }
      } else {
        msg.error('Server Error');
      }
    }
  };

  const toggleRenewDraftBills = async () => {
    try {
      if (showSectionStates.toggleRenewDraftBills == false) {
        const response = await api.get(
          'load-draft-renew-bills/' + cookie.get('user_branch'),
        );
        if (response.status == 200 && response.data.status == 200) {
          setRenewDraftBills(response.data.data);
          setShowSectionStates({
            ...showSectionStates,
            toggleRenewDraftBills: !showSectionStates.toggleRenewDraftBills,
          });
        } else if (response.status == 200 && response.data.status == 403) {
          msg.warning('Access Denided !!');
        } else {
          msg.error('Cancel Bill Loading Error');
        }
      } else {
        setShowSectionStates({
          ...showSectionStates,
          toggleRenewDraftBills: !showSectionStates.toggleRenewDraftBills,
        });
      }
    } catch (error) {
      console.log(error);
      msg.error('Something Went Wrong');
    }
  };

  const toggleCancelBills = async () => {
    try {
      if (showSectionStates.toggleCancelBills == false) {
        const response = await api.get(
          'load-cancel-bills/' + cookie.get('user_branch'),
        );
        if (response.status == 200 && response.data.status == 200) {
          setCancelBills(response.data.data);
          setShowSectionStates({
            ...showSectionStates,
            toggleCancelBills: !showSectionStates.toggleCancelBills,
          });
        } else if (response.status == 200 && response.data.status == 403) {
          msg.warning('Access Denided !!');
        } else {
          msg.error('Cancel Bill Loading Error');
        }
      } else {
        setShowSectionStates({
          ...showSectionStates,
          toggleCancelBills: !showSectionStates.toggleCancelBills,
        });
      }
    } catch (error) {
      console.log(error);
      msg.error('Something Went Wrong');
    }
  };

  const clickRenewDraft = async (selected) => {
    toggleRenewDraftBills(false);
    console.log('before reneselected data wrow');
    // console.log(selected);
    // console.log(draftRenewBillDetails);
    // setDraftRenewBillDetails({
    //     ...draftRenewBillDetails,
    draftRenewBillDetails.loan_id = selected.loan_id;
    draftRenewBillDetails.branch_id = selected.branch_id;
    draftRenewBillDetails.bill_type_id = selected.bill_type_id;
    draftRenewBillDetails.bill_no = selected.bill_no;

    // })
    // console.log(draftRenewBillDetails);

    loadBillForReNew(
      selected.branch_id,
      selected.bill_type_id,
      selected.bill_no,
      selected.bill_type.des,
      'draft',
    );
    //  console.log(loadBillForReNew);
  };

  const clickRow = async (selectedRow) => {
    setAllowEditItems(false);
    setCancelOldBill(true);
    console.log('after click raw');
    console.log(cancelOldBill);
    billTypeSearch.bill_type_id = selectedRow.bill_type_id;
    billTypeSearch.bill_type_name = selectedRow.des;
    billTypeSearch.bill_no = selectedRow.bill_no;
    setBillTypeSearch({
      ...billTypeSearch,
      bill_type_id: selectedRow.bill_type_id,
      bill_type_name: selectedRow.bill_no,
    });
    toggleCancelBills(false);
    setCancelBillId(selectedRow.id);
    console.log('cencel bill id : ' + cancelBillId);
    fetchCustomerOrBill();
  };

  const handleCalculationModeChange = async (mode) => {
    // if (loadNewBill != true) {

    setAdditionalPawnData({
      ...additionalPawnData,
      fm_interest_rate: (0).toFixed(2),
      nm_interest_rate: (0).toFixed(2),
      first_month_interest: (0).toFixed(2),
      next_month_interest: (0).toFixed(2),
      stamp_fee: (0).toFixed(2),
    });
    setNewLoan({
      ...newLoan,
      payable_amount: (0).toFixed(2),
      required_amount: (0).toFixed(2),
      calculation_mode: mode,
    });
    // }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center" ref={dataSection}>
        {moduleName}
      </h5>
      <br />
      {isLoading.init ? (
        <div>
          <Loader pullDown />
        </div>
      ) : (
        <div>
          <div className="row mb-2 justify-content-between">
            <div className="col-self">
              {additionalPawnData.ref_no ? (
                <h1
                  className="badge badge-warning"
                  style={{ fontSize: '130%' }}
                >
                  Ref No. :{' '}
                  {newLoan.stat == 'R' || newLoan.stat == 'RE'
                    ? newLoan.prev_ref_no
                    : additionalPawnData.ref_no}
                </h1>
              ) : (
                ''
              )}
            </div>
            <div className="col-self">
              <div className="row">
                <div class="dropdown">
                  <button
                    class="btn btn-sm btn-primary rounded-0 mr-2"
                    type="button"
                    id="renewBillDropdown"
                    onClick={() => toggleRenewDraftBills()}
                  >
                    <span className="text-white">Renew Bills</span>
                  </button>
                </div>
                <div class="dropdown">
                  {cookie.get('user_roles') == 1 ? (
                    <button
                      class="btn btn-sm btn-light rounded-0"
                      type="button"
                      id="cancelBillDropdown"
                      onClick={() => toggleCancelBills()}
                    >
                      <span className="text-white">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="#0000FF"
                          class="bi bi-card-text"
                          viewBox="0 0 16 16"
                        >
                          <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                          <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row compactForm">
            {/* Left column */}
            <div className="col-sm-6 section-wrap">
              <div className="form-group row">
                <div className="col-sm-3">
                  <h5>Customer</h5>
                </div>
                <div className="col-sm-7">
                  <div className="form-row">
                    <div className="col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="nic"
                        name="nic"
                        placeholder="NIC"
                        value={customer.nic}
                        onChange={handleCustomerValueChanges}
                        onKeyUp={handleCustomerSearch}
                        disabled={controlDisabledStates.customer.nic}
                        minLength={'10'}
                        maxLength={'12'}
                        autoComplete="off"
                        readOnly={isCancelBill == true}
                      />
                    </div>
                    <div className="col-sm-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info"
                        style={{ padding: '1px 5px 1px 5px' }}
                        onClick={() => enableNIC()}
                        disabled={enbleChangeCustomer}
                      >
                        <span>
                          <SafeFontAwesomeIcon icon={faEdit} size="xs" />
                        </span>
                      </button>
                    </div>
                    <div className="col-sm-2">
                      {isLoading.customer ? (
                        <div>
                          <Loader sizeSm />
                        </div>
                      ) : null}
                    </div>
                    <div className="col-sm-4">
                      {/* <div className="form-group row justify-content-end">
                        <label
                          htmlFor="nic"
                          className="col-sm-3 text-right col-form-label"
                        >
                          ID
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm col-sm-8"
                          id="id"
                          placeholder="System ID"
                          value={customer.id}
                          readOnly
                        />
                      </div> */}
                    </div>
                  </div>
                </div>
                <div className="col-sm-2">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showSectionStates.customerSection}
                    method={() => toggleCustomerSection()}
                    showText={false}
                    disabled={controlDisabledStates.customer.collapse}
                  />
                </div>
              </div>
              {showSectionStates.customerSection ? (
                <div>
                  <div className="form-group row">
                    <label
                      htmlFor="old_nic"
                      className="col-sm-4 col-form-label"
                    >
                      Old NIC
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="old_nic"
                        name="old_nic"
                        placeholder="Old NIC number"
                        value={customer.old_nic ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.oldNic || disableFields
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label htmlFor="title" className="col-sm-4 col-form-label">
                      Title
                    </label>
                    <div className="col-sm-8">
                      <select
                        name="title"
                        id="title"
                        className="form-control form-control-sm"
                        value={customer.title}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.title || disableFields
                        }
                      >
                        <option
                          value=""
                          className="dropdown-item text-muted text-light"
                          disabled
                        >
                          --
                        </option>
                        {nameTitles.map((title, index) => {
                          return (
                            <option
                              key={index}
                              className="dropdown-item"
                              data-billtype={title}
                              value={title}
                            >
                              {title}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label htmlFor="name" className="col-sm-4 col-form-label">
                      Name
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="name"
                        name="name"
                        placeholder="Full name"
                        ref={cusNameControl}
                        value={customer.name ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.name || disableFields
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="other_names"
                      className="col-sm-4 col-form-label"
                    >
                      Other Names
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="other_names"
                        name="other_names"
                        placeholder="Other names"
                        value={customer.other_names ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.otherName ||
                          disableFields
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="address_1"
                      className="col-sm-4 col-form-label"
                    >
                      Postal Address
                    </label>
                    <div className="col-sm-8">
                      <textarea
                        className="form-control form-control-sm rounded-0"
                        rows="3"
                        id="address_1"
                        name="address_1"
                        placeholder="Postal address"
                        value={customer.address_1 ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.postalAddress ||
                          disableFields
                        }
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="address_2"
                      className="col-sm-4 col-form-label"
                    >
                      Address on NIC
                    </label>
                    <div className="col-sm-8">
                      <textarea
                        className="form-control form-control-sm rounded-0"
                        id="address_2"
                        name="address_2"
                        placeholder="Address on NIC"
                        value={customer.address_2 ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.nicAddress ||
                          disableFields
                        }
                        rows="3"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="telephone"
                      className="col-sm-4 col-form-label"
                    >
                      Telephone
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="telephone"
                        name="telephone"
                        placeholder="Telephone"
                        value={customer.telephone ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.telephone ||
                          disableFields
                        }
                        onKeyPress={checkMobileNumber}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label
                      htmlFor="telephone_2"
                      className="col-sm-4 col-form-label"
                    >
                      Telephone 2
                    </label>
                    <div className="col-sm-8">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id="telephone_2"
                        name="telephone_2"
                        placeholder="New Telephone"
                        value={customer.telephone_2 ?? ''}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.telephone_2 ||
                          disableFields
                        }
                        onKeyPress={checkMobileNumber}
                      />
                    </div>
                  </div>

                  <div className="form-group row">
                    <label htmlFor="notes" className="col-sm-4 col-form-label">
                      Notes
                    </label>
                    <div className="col-sm-8">
                      <textarea
                        name="notes"
                        id="notes"
                        rows="1"
                        className="form-control form-control-sm rounded-0"
                        value={customer.notes}
                        onChange={handleCustomerValueChanges}
                        disabled={
                          controlDisabledStates.customer.notes || disableFields
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div className="col-sm-6 section-wrap">
              <div className="form-group row">
                <div className="col-sm-5">
                  <h5>Loan History</h5>
                </div>
                <div className="col-sm-2">
                  {isLoading.history ? (
                    <div>
                      <Loader sizeSm />
                    </div>
                  ) : null}
                </div>
                <div className="offset-2 col-sm-3">
                  <SystemButton
                    type={'section-toggle'}
                    collapseState={showSectionStates.transHistorySection}
                    method={() => toggleTrasHistorySection()}
                    showText={false}
                    disabled={controlDisabledStates.customer.collapse}
                  />
                </div>
              </div>
              <div
                className="row"
                style={{
                  padding: '10px',
                }}
              >
                {showSectionStates.transHistorySection ? (
                  <div
                    className="table-responsive"
                    style={{
                      height: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <table className="table table-bordered table-sm table-hover">
                      <thead className="thead-light">
                        <tr>
                          <th scope="col">#</th>
                          <th scope="col">Branch</th>
                          <th scope="col">Bill Type</th>
                          <th scope="col">No</th>
                          <th scope="col">Date</th>
                          <th scope="col">Gold Weight</th>
                          <th scope="col">Loan Amount</th>
                          {/* <th scope="col">State</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {loanHistory.loans ? (
                          loanHistory.loans.map((loan, index) => {
                            return (
                              <tr
                                key={loan.id}
                                // onClick={() => setShowSectionStates({...showSectionStates, oldPawningItems: true})}
                                onClick={() => viewOldItems(loan.loan_item)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td>{index + 1}</td>
                                <td>{loan.branch.name}</td>
                                <td>{loan.bill_type.des}</td>
                                <td>{loan.bill_no}</td>
                                <td>{loan.ddate}</td>
                                <td className="text-right">
                                  {loan.total_weight}
                                </td>
                                <td className="text-right">
                                  {loan.required_amount}
                                </td>
                                {/* <td>{loan.state}</td> */}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>

              <div
                className="row font-weight-bold text-white"
                style={{
                  bottom: '1px',
                  marginLeft: 0,
                  marginRight: 0,
                }}
              >
                <div
                  className="col-sm-5 bg-secondary"
                  style={{ border: '1px solid #eee' }}
                >
                  <h6>Pawning</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.pawning_count ? loanHistory.pawning_count : 0
                    }`}
                    &nbsp; | &nbsp;
                    {`Total: ${
                      loanHistory.pawning_total ? loanHistory.pawning_total : 0
                    }`}
                  </p>
                </div>
                <div
                  className="col-sm-5 bg-secondary"
                  style={{
                    border: '1px solid #eee',
                    cursor: loanHistory.redeem_count ? 'pointer' : 'default',
                  }}
                  onClick={
                    loanHistory.redeem_count
                      ? () => toggleTransHistoryModal('redeem')
                      : null
                  }
                >
                  <h6>Redeemed</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.redeem_count ? loanHistory.redeem_count : 0
                    }`}
                    &nbsp; | &nbsp;
                    {`Total: ${
                      loanHistory.redeemed_total
                        ? loanHistory.redeemed_total
                        : 0
                    }`}
                  </p>
                </div>
                <div
                  className="col-sm-2 bg-secondary"
                  style={{
                    border: '1px solid #eee',
                    cursor: loanHistory.other_count ? 'pointer' : 'default',
                  }}
                  onClick={
                    loanHistory.other_count
                      ? () => toggleTransHistoryModal('other')
                      : null
                  }
                >
                  <h6>Other</h6>
                  <p className="small-bold-text">
                    {`Count: ${
                      loanHistory.other_count ? loanHistory.other_count : 0
                    }`}
                  </p>
                </div>
                {/* <div className="col-sm-3 bg-secondary">
                  {`Pawning Total : ${
                    loanHistory.other_count ? loanHistory.other_count : 0
                  }`}
                </div> */}
              </div>
            </div>
          </div>
          <div className="compactForm">
            <div className="row bill-info">
              {/* <div>
                <div className="form-group row">
                  <div className="col-sm-5">
                    <h5>Pawning</h5>
                  </div>
                </div>
              </div> */}
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="bill_type_id">Bill Type</label>
                  <select
                    name="bill_type_id"
                    id="bill_type_id"
                    className="form-control form-control-sm"
                    value={newLoan.bill_type_id}
                    onChange={handlePawningAmountChanges}
                    // readOnly={customer.is_blacklisted || !allowEditItems || allowChangeBillTypeWithoutChangeItems}
                    disabled={
                      !allowEditItems || controlDisabledStates.billType.billType
                    }
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select a bill type
                    </option>
                    {billTypes.map((bill, index) => {
                      return (
                        <option
                          key={index}
                          className="dropdown-item"
                          data-billtype={bill.des}
                          value={bill.id}
                        >
                          {bill.des}
                          {/* -{bill.period.months} */}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="bill_count">Bill No</label>
                  <input
                    type="text"
                    name="bill_count"
                    id="bill_count"
                    value={newLoan.bill_count}
                    onFocus={selectAllText}
                    className={`form-control form-control-sm font-weight-bold text-right ${
                      isLoading.billCount ? 'inputLoader' : ''
                    }`}
                    onChange={handlePawningAmountChanges}
                    onKeyUp={handleBillSearch}
                    disabled={
                      customer.is_blacklisted ||
                      !allowEditItems ||
                      controlDisabledStates.billType.billNo
                    }
                  />
                </div>
              </div>
              <div className="col-sm-2">
                <label htmlFor="ddate">Pawning date</label>
                <input
                  type="date"
                  name="ddate"
                  id="ddate"
                  className={`form-control form-control-sm text-right font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
                  value={newLoan.ddate}
                  onChange={handlePawningAmountChanges}
                  // readOnly={customer.is_blacklisted ? true : false}
                  disabled={
                    controlDisabledStates.billType.pawningDate ||
                    !allowEditItems
                  }
                  readOnly={cookie.get('user_roles') != 1}
                />
              </div>
              <div className="col-sm-2">
                <label htmlFor="duration">Duration</label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  className={`form-control-plaintext form-control-sm font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
                  value={additionalPawnData.duration}
                  placeholder="-- Select a bill type"
                  readOnly
                />
              </div>
              <div className="col-sm-2">
                <label htmlFor="last_date">Final date</label>
                <input
                  type="date"
                  name="last_date"
                  id="last_date"
                  className={`form-control-plaintext form-control-sm font-weight-bold ${
                    isLoading.billCount ? 'inputLoader' : ''
                  }`}
                  value={newLoan.final_date}
                  readOnly
                />
              </div>
              <div className="col-sm-1">
                {newLoan.stat == 'P' ? (
                  <h1
                    className="badge badge-success m-3"
                    style={{ fontSize: 15 }}
                  >
                    {newLoan.stat}
                  </h1>
                ) : (
                  ''
                )}
                {newLoan.stat == 'F' ? (
                  <h1
                    className="badge badge-primary m-3"
                    style={{ fontSize: 15 }}
                  >
                    {newLoan.stat}
                  </h1>
                ) : (
                  ''
                )}
                {newLoan.stat == 'R' ? (
                  <h1
                    className="badge badge-primary m-3"
                    style={{ fontSize: 15 }}
                  >
                    {newLoan.stat}
                  </h1>
                ) : (
                  ''
                )}
                {newLoan.stat == 'C' ? (
                  <h1
                    className="badge badge-danger m-3"
                    style={{ fontSize: 15 }}
                  >
                    {newLoan.stat}
                  </h1>
                ) : (
                  ''
                )}
                {newLoan.stat == 'D' ? (
                  <h1
                    className="badge badge-danger m-3"
                    style={{ fontSize: 15 }}
                  >
                    {newLoan.stat}
                  </h1>
                ) : (
                  ''
                )}
                {newLoan.stat == 'RE' ? (
                  <div>
                    <label htmlFor="last_date">
                      {newLoan.old_bill_type_id} - {newLoan.old_bill_no}
                    </label>
                    <h1
                      className="badge badge-success"
                      style={{ fontSize: 15 }}
                    >
                      {newLoan.stat}
                    </h1>
                  </div>
                ) : (
                  ''
                )}
              </div>
            </div>

            <div className="form-group row bg-items">
              <div className="col-sm-5">
                <h5>
                  Items &nbsp;
                  {pawningItems ? (
                    <small>
                      <span className="badge badge-pill badge-secondary">
                        {pawningItems.length}
                      </span>
                    </small>
                  ) : null}
                </h5>
              </div>
              <div className="offset-5 col-sm-2">
                <SystemButton
                  type={'section-toggle'}
                  collapseState={showSectionStates.itemSection}
                  method={() => toggleItemsSection()}
                  showText={false}
                  classes="btn btn-white btn-block btn-sm"
                  disabled={
                    controlDisabledStates.items.collapse || !allowEditItems
                  }
                />
              </div>
            </div>
            {showSectionStates.itemSection ? (
              <div className="row table-responsive header-fixed-scrollable">
                <table className="table table-sm table-bordered">
                  <thead className="thead-light text-center">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Category</th>
                      <th scope="col">Item</th>
                      <th scope="col">Count</th>
                      <th scope="col">Condition</th>
                      <th scope="col">Condition Note</th>
                      <th scope="col">Type</th>
                      <th scope="col">Rate</th>
                      <th scope="col">Densimeter KT</th>
                      <th scope="col">Weight(g)</th>
                      <th scope="col">Value(LKR)</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody className="text-center bg-items">
                    {pawningItems.map((item, index) => {
                      return (
                        <tr key={item.index}>
                          <th scope="row">{parseInt(index) + 1}</th>
                          <td>
                            <select
                              name="item_category"
                              id="item_category"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={pawningItems[index].category_id}
                              onChange={filterItemsList}
                              disabled={
                                controlDisabledStates.items.category ||
                                !allowEditItems
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                ---
                              </option>
                              {itemCategories.map((category) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.description}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td>
                            <select
                              name="item_id"
                              id="item_id"
                              data-id={index}
                              className={`form-control form-control-sm ${
                                isLoading.items ? 'inputLoaderCenter' : ''
                              }`}
                              value={pawningItems[index].item_id}
                              onChange={handleItemsChange}
                              disabled={
                                controlDisabledStates.items.category ||
                                !allowEditItems
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                ---
                              </option>
                              {pawningItems[index].items.map((row) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={row.id}
                                    value={row.id}
                                  >
                                    {row.name}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td style={{ width: '80px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="qty"
                              id="qty"
                              data-id={index}
                              value={pawningItems[index].qty}
                              onChange={handleItemsChange}
                              ref={itemQtyControl}
                              disabled={controlDisabledStates.items.count}
                              readOnly={!allowEditItems}
                            />
                          </td>
                          <td>
                            <select
                              name="item_condition_id"
                              id="item_condition_id"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={pawningItems[index].item_condition_id}
                              onChange={handleItemsChange}
                              disabled={
                                controlDisabledStates.items.condition ||
                                !allowEditItems
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                ---
                              </option>
                              {itemConditions.map((condition) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={condition.id}
                                    value={condition.id}
                                  >
                                    {condition.description}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          {/* condition_note */}
                          <td style={{ width: '100px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="condition_note"
                              id="condition_note"
                              data-id={index}
                              value={pawningItems[index].condition_note}
                              onChange={handleItemsChange}
                              disabled={
                                controlDisabledStates.items.condition_note
                              }
                              readOnly={!allowEditItems}
                            />
                          </td>
                          <td style={{ width: '100px' }}>
                            <select
                              name="gold_rate_id"
                              id="gold_rate_id"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={pawningItems[index].gold_rate_id}
                              onChange={handleItemsChange}
                              disabled={
                                controlDisabledStates.items.type ||
                                !allowEditItems
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                ---
                              </option>
                              {goldRates.map((type) => {
                                if (type.gold_types === null) {
                                  return null;
                                }
                                return (
                                  <option
                                    disabled={type.is_active ? false : true}
                                    className="dropdown-item"
                                    key={type.id}
                                    value={type.id}
                                  >
                                    {type.gold_types.category} (
                                    {type.gold_types.display_name})
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td style={{ width: '100px' }}>
                            <input
                              type="text"
                              className="form-control-plaintext form-control-sm text-right"
                              name="gold_rate"
                              id="gold_rate"
                              data-id={index}
                              value={pawningItems[index].gold_rate}
                              onChange={handleItemsChange}
                              readOnly
                            />
                          </td>
                          <td style={{ width: '80px' }}>
                            {/* dencimeters */}
                            <select
                              name="item_density"
                              id="item_density"
                              data-id={index}
                              className="form-control form-control-sm"
                              value={pawningItems[index].item_density}
                              onChange={handleItemsChange}
                              disabled={
                                controlDisabledStates.items.type ||
                                !allowEditItems
                              }
                            >
                              <option
                                value=""
                                className="dropdown-item text-muted text-light"
                                disabled
                              >
                                ---
                              </option>
                              {dencimeters.map((type) => {
                                return (
                                  <option
                                    className="dropdown-item"
                                    key={type}
                                    value={type}
                                  >
                                    {type}
                                  </option>
                                );
                              })}
                            </select>
                            {/*  <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="item_density"
                              id="item_density"
                              data-id={index}
                              value={pawningItems[index].item_density}
                              onChange={handleItemsChange}
                              onFocus={(e)=>e.target.select()}
                              disabled={controlDisabledStates.items.densimeter}
                            /> */}
                          </td>
                          <td style={{ width: '100px' }}>
                            <input
                              type="text"
                              className="form-control form-control-sm text-right"
                              name="gold_weight"
                              id="gold_weight"
                              data-id={index}
                              value={pawningItems[index].gold_weight}
                              onChange={handleItemsChange}
                              onFocus={(e) => e.target.select()}
                              disabled={controlDisabledStates.items.weight}
                              readOnly={!allowEditItems}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control-plaintext form-control-sm text-right"
                              name="gold_value"
                              id="gold_value"
                              data-id={index}
                              value={pawningItems[index].gold_value}
                              onChange={handleItemsChange}
                              readOnly
                            />
                          </td>
                          <td>
                            <SystemButton
                              type={'remove-row'}
                              method={() =>
                                removeItem(pawningItems[index].index)
                              }
                              showText={false}
                              disabled={
                                controlDisabledStates.items.removeItem ||
                                !allowEditItems
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-items">
                    <tr>
                      <td className="text-center">
                        <SystemButton
                          type={'add-row'}
                          method={() => addNewItem()}
                          showText={false}
                          disabled={
                            controlDisabledStates.items.addItems ||
                            !allowEditItems
                          }
                        />
                      </td>
                      <td colSpan="7" className="text-center">
                        Total
                      </td>
                      <td className="text-right font-weight-bold">
                        {parseFloat(newLoan.total_weight).toFixed(2)}
                      </td>
                      <td className="text-right font-weight-bold">
                        {parseFloat(newLoan.gold_value).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : null}

            <div className="row justify-content-start">
              <div className="col-auto">
                <h5>Calculation Mode : </h5>
              </div>
              <div className="col-auto">
                <label
                  className={
                    newLoan.calculation_mode == 'FORWARD'
                      ? 'radio-lable-active'
                      : 'radio-lable'
                  }
                  for="forward"
                >
                  Forward Mode
                </label>
                <input
                  type="radio"
                  name="calculation_mode"
                  id="forward"
                  className="calculation-mode-radios"
                  onChange={() => handleCalculationModeChange('FORWARD')}
                  hidden
                />
                <label
                  className={
                    newLoan.calculation_mode == 'BACKWARD'
                      ? 'radio-lable-active'
                      : 'radio-lable'
                  }
                  for="backward"
                >
                  {' '}
                  Backward Mode
                </label>
                <input
                  type="radio"
                  name="calculation_mode"
                  id="backward"
                  className="calculation-mode-radios"
                  onChange={() => handleCalculationModeChange('BACKWARD')}
                  hidden
                />
              </div>
              <div className="col-auto"></div>
            </div>

            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="fm_interest_rate">
                    First month interest rate
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="fm_interest_rate"
                    name="fm_interest_rate"
                    value={additionalPawnData.fm_interest_rate}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="nm_interest_rate">
                    Other months' interest rate
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="nm_interest_rate"
                    name="nm_interest_rate"
                    value={additionalPawnData.nm_interest_rate}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="stamp_fee">Stamp Duty</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="stamp_fee"
                    name="stamp_fee"
                    value={additionalPawnData.stamp_fee}
                    readOnly
                  />
                </div>
              </div>
              {newLoan.calculation_mode == 'FORWARD' ? (
                <div className="col-sm-3">
                  <div className="form-group">
                    <label htmlFor="payable_amount">Payable Amount</label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-right font-weight-bold"
                      id="payable_amount"
                      name="payable_amount"
                      value={newLoan.payable_amount}
                      onFocus={selectAllText}
                      onChange={handlePawningAmountChanges}
                      onKeyUp={checkPayableAmount}
                      disabled={controlDisabledStates.loan.payableAmount}
                      readOnly={!allowEditItems && !isRenewalPawning}
                    />
                  </div>
                </div>
              ) : (
                <div className="col-sm-3">
                  <div className="form-group">
                    <label htmlFor="required_amount">Loan Amount</label>
                    <input
                      type="text"
                      className="form-control form-control-sm text-right font-weight-bold"
                      id="required_amount"
                      name="required_amount"
                      value={newLoan.required_amount}
                      onFocus={selectAllText}
                      onChange={handlePawningAmountChanges}
                      onKeyUp={checkPayableAmount}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="fm_interest">First month interest</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="fm_interest"
                    name="fm_interest"
                    value={additionalPawnData.first_month_interest}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="nm_interest">Other months' interest</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="nm_interest"
                    name="nm_interest"
                    value={additionalPawnData.next_month_interest}
                    readOnly
                  />
                </div>
              </div>
              {/* addition amount commented */}
              {/* <div className="col-sm-3">
                <div className="form-group">
                    <div className="row">
                        <div className="col">
                            <label htmlFor="addition">Addition</label>
                        </div>
                        <div className="col-sm-3">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="operation" id="plus" checked={additionalPawnData.operation == 'plus'} value="plus" onChange={changeRadioButton} disabled={(!allowEditItems) && (!isRenewalPawning)}/>
                                <label class="form-check-label" for="plus">
                                    +
                                </label>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="operation" id="minus" value="minus" onChange={changeRadioButton}  checked={additionalPawnData.operation == 'minus'} disabled={(!allowEditItems) && (!isRenewalPawning)}/>
                                <label class="form-check-label" for="minus">
                                    -
                                </label>
                            </div>
                        </div>
                    </div>
                    <input
                        type="text"
                        className="form-control form-control-sm text-right font-weight-bold"
                        id="addition"
                        name="addition"
                        value={additionalPawnData.additional_fees}
                        onChange={handlePawningAmountChanges}
                        onKeyPress={checkInputIsInteger}
                        readOnly={(!allowEditItems) && (!isRenewalPawning)}
                    />
                </div>
              </div> */}
            </div>
            <div className="row">
              <div className="offset-7 col-sm-5">
                {newLoan.calculation_mode == 'FORWARD' ? (
                  <div className="form-group row">
                    <label
                      htmlFor="required_amount"
                      className="col-sm-5 col-form-label text-right"
                      style={{ fontSize: '20px' }}
                    >
                      Loan Amount
                    </label>
                    <div className="col-sm-7">
                      <input
                        type="text"
                        className="form-control-plaintext form-control-lg text-right font-weight-bold important-text"
                        id="required_amount"
                        name="required_amount"
                        min="0.00"
                        step="0.01"
                        value={newLoan.required_amount}
                        onChange={
                          cookie.get('permissions').update_loan
                            ? handlePawningAmountChanges
                            : null
                        }
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group row">
                    <label
                      htmlFor="payable_amount"
                      className="col-sm-5 col-form-label text-right"
                      style={{ fontSize: '20px' }}
                    >
                      Payable Amount
                    </label>
                    <div className="col-sm-7">
                      <input
                        type="text"
                        className="form-control-plaintext form-control-lg text-right font-weight-bold important-text"
                        id="payable_amount"
                        name="payable_amount"
                        min="0.00"
                        step="0.01"
                        value={newLoan.payable_amount}
                        onChange={
                          cookie.get('permissions').update_loan
                            ? handlePawningAmountChanges
                            : null
                        }
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="service_charge">Service Charge</label>
                  <input
                    type="text"
                    className="form-control form-control-sm text-right font-weight-bold"
                    id="service_charge"
                    name="service_charge"
                    value={newLoan.service_charge}
                    onChange={handlePawningAmountChanges}
                    readOnly={!allowEditItems && !isRenewalPawning}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-2">
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="is_old_bill"
                    name="is_old_bill"
                    checked={newLoan.is_old_bill}
                    onChange={handlePawningAmountChanges}
                    disabled={permission.old_bill_disable}
                  />
                  <label className="custom-control-label" htmlFor="is_old_bill">
                    Is Old Bill
                  </label>
                </div>
              </div>

              {isEdit ? null : (
                <>
                  {/* <div className="col-sm-2">
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="is_renew"
                        name="is_renew"
                        checked={newLoan.is_renew}
                        onChange={handlePawningAmountChanges}
                        disabled={controlDisabledStates.loan.isRenewal}
                      />
                      <label
                        className="custom-control-label"
                        htmlFor="is_renew"
                      >
                        Renewal
                        
                      </label>
                    </div>
                  </div> */}
                  {/* <div className="col-sm-2">
                    <select
                      name="prev_bill_type"
                      id="prev_bill_type"
                      hidden={newLoan.is_renew ? false : true}
                      className="form-control-sm font-weight-bold"
                      value={newLoan.prev_bill_type}
                      onChange={handlePawningAmountChanges}
                    >
                      <option value="" className="text-muted">
                        --Select old bill type
                      </option>
                      {billTypes.map((bill, index) => {
                        return (
                          <option
                            key={index}
                            className="dropdown-item"
                            value={bill.id}
                          >
                            {bill.des}
                          </option>
                        );
                      })}
                    </select>
                  </div> */}
                  {/* <div className="col-sm-2">
                    <input
                      type={newLoan.is_renew ? 'text' : 'hidden'}
                      className="form-control-sm font-weight-bold"
                      id="prev_bill_no"
                      name="prev_bill_no"
                      value={newLoan.prev_bill_no}
                      onChange={handlePawningAmountChanges}
                      placeholder="Old bill number"
                      disabled={controlDisabledStates.loan.renewalBillNo}
                    />
                  </div> */}
                </>
              )}
            </div>
            <div className="row justify-content-end">
              <div className="col-sm-2">
                <SystemButton type="reset" showText={true} method={resetAll} />
              </div>
              {isEdit ? (
                <>
                  <div className="col-sm-3">
                    {(cookie.get('permissions')
                      ? cookie.get('permissions').show_branch_selector
                      : 0) === 1 ? (
                      <SystemButton
                        type="print"
                        showText={true}
                        btnText="Re-print Bill"
                        method={reprintPawningBill}
                      />
                    ) : null}
                  </div>
                  {/* <div className="col-sm-3">
                        <SystemButton
                        type="load"
                        showText={true}
                        btnText="Quick Renew"
                        method={renew}
                        />
                    </div> */}
                  {cookie.get('permissions') ? (
                    cookie.get('permissions').update_loan ? (
                      <div className="col-sm-3">
                        <SystemButton
                          type="no-form-save"
                          showText={true}
                          btnText="Update"
                          method={updatePawning}
                          disabled={disabledUpdateBtn}
                        />
                      </div>
                    ) : null
                  ) : null}
                </>
              ) : (
                <div className="col-sm-3">
                  {controlDisabledStates.saveButton ? (
                    <SystemButton
                      type="no-form-save"
                      showText={true}
                      btnText="Save"
                      disabled={
                        customer.is_blacklisted || disabledSaveBtn
                          ? true
                          : false
                      }
                      method={handleSubmit}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <br />
          {isEdit ? (
            <>
              <div className="row justify-content-center">
                <p className="h5 text-danger">
                  Last updated at : {newLoan.updated_at}
                </p>
              </div>
              <br />
            </>
          ) : null}
        </div>
      )}

      {/* Timer modal componenet */}
      <UnclosableModal modalState={showSectionStates.timerModal}>
        <div className="container">
          <br />
          <div className="row">
            <div className="col-sm-7">
              <h5>
                Pawning approval request sent. Please wait for the response..
              </h5>
              <br />
              <h6>Reference number</h6>
              <h2>{approvalRefNo}</h2>
            </div>
            <div className="offset-1 col-sm-4">
              <CountdownCircleTimer
                isPlaying
                duration={300}
                colors={'#004777'}
                onComplete={() => endTimer()}
              >
                {approvalTimerText}
              </CountdownCircleTimer>
            </div>
          </div>
          <div className="row justify-content-end">
            <div className="col">
              <button
                className="btn btn-danger btn-sm p-3"
                onClick={() => closeApprovelRequest(approvalRefNo)}
              >
                Close
              </button>
            </div>
          </div>
          <br />
        </div>
      </UnclosableModal>
      <UnclosableModal modalState={showSectionStates.timerModalCusLimit}>
        <div className="container">
          <br />
          <div className="row">
            <div className="col-sm-7">
              <h5>
                Pawning approval request sent. Please wait for the response..
              </h5>
              <br />
              <h6>Reference number</h6>
              <h2>{approvalRefNo}</h2>
            </div>
            <div className="offset-1 col-sm-4">
              <CountdownCircleTimer
                isPlaying
                duration={300}
                colors={'#004777'}
                onComplete={() => endTimerCusLimit()}
              >
                {approvalTimerText}
              </CountdownCircleTimer>
            </div>
          </div>
          <div className="row justify-content-end">
            <div className="col">
              <button
                className="btn btn-danger btn-sm p-3"
                onClick={() => closeApprovelRequestCusLimit(approvalRefNo)}
              >
                Close
              </button>
            </div>
          </div>
          <br />
        </div>
      </UnclosableModal>
      {/* End of timer modal componenet */}

      {/* History component modal */}
      <FormModal
        moduleName="Loan History"
        modalState={showSectionStates.historyModal}
        toggleFormModal={toggleTransHistoryModal}
      >
        <div className="modal-body">
          {isLoading.history ? (
            <div>
              <Loader pullDown />
            </div>
          ) : (
            <HistoryDetails type={showSectionStates.historyModalType} />
          )}
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleTransHistoryModal}
            showText={true}
          />
        </div>
      </FormModal>
      {/* End of history component modal */}

      {/* Old pawning items modal */}
      <FormModal
        moduleName="Old pawning items"
        modalState={showSectionStates.oldPawningItems}
        toggleFormModal={toggleOldItemsModal}
      >
        <div className="modal-body">
          <table className="table table-bordered table-striped table-sm">
            <thead className="thead-light">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Item</th>
                <th scope="col">Condition</th>
                <th scope="col">KT</th>
                <th scope="col">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {loanHistory.loanItems ? (
                loanHistory.loanItems.map((item, index) => {
                  return (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.item.name}</td>
                      <td>{item.condition.description}</td>
                      <td>{item.gold_rate.gold_types.category}</td>
                      <td>{item.qty}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleOldItemsModal}
            showText={true}
          />
        </div>
      </FormModal>
      {/* End of old pawning items modal */}

      {/* Quick renew modal */}
      <FormModal
        moduleName="Quick Renew"
        modalState={showSectionStates.quickRenewModal}
        toggleFormModal={toggleQuickRenewModal}
      >
        <div className="compactForm">
          <div className="modal-body">
            <div className="row">
              <div className="offset-10 col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_pawning_date">New Pawning Date</label>
                  <input
                    type="text"
                    name="new_pawning_date"
                    id="new_pawning_date"
                    className="form-control-plaintext form-control-sm font-weight-bold"
                    value={renewData.newPawningDate}
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-3">
                <div className="form-group">
                  <label htmlFor="new_bill_type_id">New Bill Type</label>
                  <select
                    name="new_bill_type_id"
                    id="new_bill_type_id"
                    className="form-control form-control-sm"
                    value={renewData.newBillTypeId}
                    onChange={handleRenewValueChanges}
                  >
                    <option
                      value=""
                      className="dropdown-item text-muted text-light"
                      disabled
                    >
                      -- Select a bill type
                    </option>
                    {billTypes.map((bill, index) => {
                      return (
                        <option
                          key={index}
                          className="dropdown-item"
                          value={bill.id}
                        >
                          {bill.des}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_bill_no">New Bill No</label>
                  <input
                    type="text"
                    name="new_bill_no"
                    id="new_bill_no"
                    value={renewData.newBillno}
                    className={`form-control-plaintext form-control-sm font-weight-bold ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    disabled
                  />
                </div>
              </div>
              <div className="offset-3 col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_duration">New Pawning Duration</label>
                  <input
                    type="text"
                    name="new_duration"
                    id="new_duration"
                    className={`form-control-plaintext form-control-sm font-weight-bold ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    value={additionalRenewData.newDuration}
                    placeholder="-- Select a bill type"
                    disabled
                  />
                </div>
              </div>
              <div className="col-sm-2">
                <div className="form-group">
                  <label htmlFor="new_last_date">New Final Date</label>
                  <input
                    type="text"
                    name="new_last_date"
                    id="new_last_date"
                    className={`form-control-plaintext form-control-sm font-weight-bold text-right ${
                      isLoading.newBillno ? 'inputLoader' : ''
                    }`}
                    value={additionalRenewData.newFinalDate}
                    placeholder="-- Select a bill type"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleQuickRenewModal}
              showText={true}
            />
            <SystemButton
              type="no-form-save"
              method={toggleQuickRenewModal}
              showText={true}
              method={handleRenewSubmit}
            />
          </div>
        </div>
      </FormModal>
      {/* Quick renew modal end */}

      {/* Approval confirmation modal */}
      <FormModal
        moduleName="Alert"
        modalState={showSectionStates.approvalConfirmation}
        toggleFormModal={toggleApprovalConfirmation}
        width="40%"
        baseColor="#6C757D"
        clos
      >
        <div className="modal-body">
          <div className="text-center">This action requires an approval</div>
          {/* <div className="container row">
          </div> */}
          <br />
          <div className="row form-group">
            <div className="col-sm-4">
              <label htmlFor="approving_officer">Officer</label>
            </div>
            <select
              name="approving_officer"
              id="approving_officer"
              className="form-control form-control-sm col-sm-8 rounded-0"
              value={newLoan.approving_officer}
              onChange={handlePawningAmountChanges}
              readOnly={customer.is_blacklisted ? true : false}
            >
              <option
                value=""
                className="dropdown-item text-muted text-light"
                disabled
              >
                -- Select an officer
              </option>
              {officers.map((officer, index) => {
                return (
                  <option
                    key={index}
                    className="dropdown-item"
                    value={officer.id}
                  >
                    {officer.name}
                  </option>
                );
              })}
            </select>
          </div>
          <p className="text-center text-muted">- or -</p>
          <div className="row form-group">
            <div className="col-sm-4">
              <label htmlFor="approval_remarks">Remarks</label>
            </div>
            <input
              type="text"
              name="approval_remarks"
              id="approval_remarks"
              className="form-control form-control-sm col-sm-8 rounded-0"
              value={newLoan.approval_remarks}
              onChange={handlePawningAmountChanges}
              maxLength="50"
            />
          </div>
          {loadBillTypeForApproval.bill_no ? (
            <div className="row form-group">
              <div className="col-sm-7 text-right">
                <label htmlFor="bill_type">
                  Old Bill Type : {loadBillTypeForApproval.bill_type_name}
                </label>
              </div>
              <label htmlFor="bill_type">
                Old Bill No : {loadBillTypeForApproval.bill_no}
              </label>
            </div>
          ) : null}
        </div>
        <div className="modal-footer">
          <div className="row">
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => approvalConfirmation(false)}
            >
              Don't send
            </button>
            <button
              type="button"
              className="btn btn-info btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => approvalConfirmation(true)}
              disabled={disableSendApproveButton}
            >
              Send for approval
            </button>
          </div>
        </div>
      </FormModal>
      <FormModal
        moduleName="Alert"
        modalState={showSectionStates.approvalConfirmationcuslimit}
        toggleFormModal={toggleApprovalConfirmationcuslimit}
        width="40%"
        baseColor="#6C757D"
      >
        <div className="modal-body">
          <div className="text-center">This action requires an approval</div>
          <h4>*Customer Bill Count Exceed</h4>
          {/* <div className="container row">
          </div> */}
          <br />
          <div className="row form-group">
            <div className="col-sm-4">
              <label htmlFor="approving_officer">Officer</label>
            </div>
            <select
              name="approving_officer"
              id="approving_officer"
              className="form-control form-control-sm col-sm-8 rounded-0"
              value={newLoan.approving_officer}
              onChange={handlePawningAmountChanges}
              readOnly={customer.is_blacklisted ? true : false}
            >
              <option
                value=""
                className="dropdown-item text-muted text-light"
                disabled
              >
                -- Select an officer
              </option>
              {officers.map((officer, index) => {
                return (
                  <option
                    key={index}
                    className="dropdown-item"
                    value={officer.id}
                  >
                    {officer.name}
                  </option>
                );
              })}
            </select>
          </div>
          <p className="text-center text-muted">- or -</p>
          <div className="row form-group">
            <div className="col-sm-4">
              <label htmlFor="approval_remarks">Remarks</label>
            </div>
            <input
              type="text"
              name="approval_remarks"
              id="approval_remarks"
              className="form-control form-control-sm col-sm-8 rounded-0"
              value={newLoan.approval_remarks}
              onChange={handlePawningAmountChanges}
              maxLength="50"
            />
          </div>
        </div>
        <div className="modal-footer">
          <div className="row">
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => approvalConfirmationcuslimit(false)}
            >
              Don't send
            </button>
            <button
              type="button"
              className="btn btn-info btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => approvalConfirmationcuslimit(true)}
              // disabled={disableSendApproveButtonCust}
            >
              Send for approval
            </button>
          </div>
        </div>
      </FormModal>
      {/* End of approval confirmation modal */}
      <ConfirmDialog />

      {/* start cancel bills model */}
      <FormModal
        moduleName="Cancel Bills"
        modalState={showSectionStates.toggleCancelBills}
        toggleFormModal={toggleCancelBills}
        width="50%"
        // baseColor="#6C757D"
      >
        <div className="modal-body">
          <div style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            <table className="table table-sm table-hover">
              <thead
                class="thead-dark"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  width: '100%',
                }}
              >
                <tr>
                  <th className="col-2">Date</th>
                  <th className="col-2">Bill Type</th>
                  <th className="col-2">Bill No</th>
                  <th className="col-4">Customer</th>
                  <th className="col-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {cancelBills.map((bill) => {
                  return (
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => clickRow(bill)}
                    >
                      <td className="col-2">{bill.ddate}</td>
                      <td className="col-1">{bill.des}</td>
                      <td className="col-1">{bill.bill_no}</td>
                      <td className="col-8">{bill.name}</td>
                      <td className="col-8">
                        {bill.status == 'C' ? (
                          <span className="badge badge-warning w-100">
                            <h6 className="mb-0">Cancel</h6>
                          </span>
                        ) : (
                          <span className="badge badge-danger w-100">
                            <h6 className="mb-0">Delete</h6>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <div className="row">
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => toggleCancelBills(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </FormModal>
      {/* end cancel bills model */}

      {/* start draft renew bills model */}
      <FormModal
        moduleName="Draft Renew Bills"
        modalState={showSectionStates.toggleRenewDraftBills}
        toggleFormModal={toggleRenewDraftBills}
        width="50%"
        // baseColor="#6C757D"
      >
        <div className="modal-body">
          <div style={{ maxHeight: '500px', overflowY: 'scroll' }}>
            <table className="table table-sm">
              <thead
                class="thead-dark"
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  width: '100%',
                }}
              >
                <tr>
                  <th className="col-2">Date</th>
                  <th className="col-2">Bill Type</th>
                  <th className="col-2">Bill No</th>
                  <th className="col-6">Customer</th>
                </tr>
              </thead>
              <tbody>
                {renewDraftBills.map((bill) => {
                  return (
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => clickRenewDraft(bill)}
                    >
                      <td className="col-2">{bill.date}</td>
                      <td className="col-1">{bill.bill_type.des}</td>
                      <td className="col-1">{bill.bill_no}</td>
                      <td className="col-8">{bill.customer.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <div className="row">
            <button
              type="button"
              className="btn btn-outline-secondary btn-block btn-sm rounded-0 shadow-sm"
              onClick={() => toggleRenewDraftBills(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </FormModal>
      {/* end draft renew bills model */}
    </div>
  );
  /* --- End of component renders --- */
};

export default ReLoans;
