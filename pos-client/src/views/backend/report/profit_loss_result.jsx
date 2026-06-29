import React from 'react';

function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) return Number(0).toFixed(decimal);
    return n.toFixed(decimal);
}

function StatLine({ label, value, decimal, negative }) {
    return (
        <p className="d-flex justify-content-between mb-2" style={{ fontSize: '0.9rem' }}>
            <span>{label}</span>
            <span>{negative ? `- ${formatMoney(value, decimal)}` : formatMoney(value, decimal)}</span>
        </p>
    );
}

function SummaryCard({ title, children }) {
    return (
        <div className="ui-card h-100" style={{ padding: '16px 18px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
            <hr className="my-2" />
            <div className="mt-2">{children}</div>
        </div>
    );
}

export default function ProfitLossResult({ data }) {
    if (!data) return null;

    const decimal = data.decimal ?? 2;
    const purchase = data.purchase ?? {};
    const sale = data.sale ?? {};
    const ret = data.return ?? {};
    const purchaseReturn = data.purchase_return ?? {};
    const paymentReceived = data.payment_received ?? {};
    const paymentSent = data.payment_sent ?? {};

    const productCost = Number(data.product_cost ?? 0);
    const productTax = Number(data.product_tax ?? 0);
    const expense = Number(data.expense ?? 0);
    const income = Number(data.income ?? 0);
    const payroll = Number(data.payroll ?? 0);

    const profitBasic = Number(sale.grand_total ?? 0) - productCost;
    const profitWithReturns =
        Number(sale.grand_total ?? 0)
        - productCost
        - Number(ret.grand_total ?? 0)
        + Number(purchaseReturn.grand_total ?? 0);

    const netProfit =
        (Number(sale.grand_total ?? 0) - Number(sale.shipping_cost ?? 0) - Number(sale.tax ?? 0))
        - (productCost - productTax)
        - (Number(ret.grand_total ?? 0) - Number(ret.tax ?? 0))
        + (Number(purchaseReturn.grand_total ?? 0) - Number(purchaseReturn.tax ?? 0))
        - expense
        + income;

    const cashInHand =
        Number(paymentReceived.amount ?? 0)
        - Number(paymentSent.amount ?? 0)
        - Number(ret.grand_total ?? 0)
        + Number(purchaseReturn.grand_total ?? 0)
        - expense
        - payroll;

    const fmt = (value) => formatMoney(value, decimal);

    return (
        <div className="profit-loss-result">
            <div className="row g-3 mt-1">
                <div className="col-md-3">
                    <SummaryCard title="Purchase">
                        <StatLine label="Grand Total" value={purchase.grand_total} decimal={decimal} />
                        <StatLine label="Purchase" value={purchase.count} decimal={0} />
                        <StatLine label="Paid" value={purchase.paid_amount} decimal={decimal} />
                        <StatLine label="Tax" value={purchase.tax} decimal={decimal} />
                        <StatLine label="Discount" value={purchase.discount} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Sale">
                        <StatLine label="Grand Total" value={sale.grand_total} decimal={decimal} />
                        <StatLine label="Shipping Cost" value={sale.shipping_cost} decimal={decimal} />
                        <StatLine label="Sale" value={sale.count} decimal={0} />
                        <StatLine label="Paid" value={sale.paid_amount} decimal={decimal} />
                        <StatLine label="Tax" value={sale.tax} decimal={decimal} />
                        <StatLine label="Discount" value={sale.discount} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Sale Return">
                        <StatLine label="Grand Total" value={ret.grand_total} decimal={decimal} />
                        <StatLine label="Return" value={ret.count} decimal={0} />
                        <StatLine label="Tax" value={ret.tax} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Purchase Return">
                        <StatLine label="Grand Total" value={purchaseReturn.grand_total} decimal={decimal} />
                        <StatLine label="Return" value={purchaseReturn.count} decimal={0} />
                        <StatLine label="Tax" value={purchaseReturn.tax} decimal={decimal} />
                    </SummaryCard>
                </div>
            </div>

            <div className="row g-3 mt-1">
                <div className="col-md-4">
                    <SummaryCard title="Profit / Loss">
                        <StatLine label="Sale" value={sale.grand_total} decimal={decimal} />
                        <StatLine label="Product Cost" value={productCost} decimal={decimal} negative />
                        <StatLine label="Profit" value={profitBasic} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-4">
                    <SummaryCard title="Profit / Loss">
                        <StatLine label="Sale" value={sale.grand_total} decimal={decimal} />
                        <StatLine label="Product Cost" value={productCost} decimal={decimal} negative />
                        <StatLine label="Sale Return" value={ret.grand_total} decimal={decimal} negative />
                        <StatLine label="Purchase Return" value={purchaseReturn.grand_total} decimal={decimal} />
                        <StatLine label="Profit" value={profitWithReturns} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-4">
                    <SummaryCard title="Net Profit / Net Loss">
                        <h4 className="text-center my-3">{fmt(netProfit)}</h4>
                        <p className="text-center text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                            (Sale {fmt(sale.grand_total)} - Shipping {fmt(sale.shipping_cost)} - Tax {fmt(sale.tax)})
                            - (Product Cost {fmt(productCost)} - Tax {fmt(productTax)})
                            - (Return {fmt(ret.grand_total)} - Tax {fmt(ret.tax)})
                            + (Purchase Return {fmt(purchaseReturn.grand_total)} - Tax {fmt(purchaseReturn.tax)})
                            - (Expense {fmt(expense)}) + (Income {fmt(income)})
                        </p>
                    </SummaryCard>
                </div>
            </div>

            <div className="row g-3 mt-1">
                <div className="col-md-3">
                    <SummaryCard title="Payment Received">
                        <StatLine label="Amount" value={paymentReceived.amount} decimal={decimal} />
                        <StatLine label="Received" value={paymentReceived.count} decimal={0} />
                        <StatLine label="Cash" value={paymentReceived.cash} decimal={decimal} />
                        <StatLine label="Cheque" value={paymentReceived.cheque} decimal={decimal} />
                        <StatLine label="Credit Card" value={paymentReceived.credit_card} decimal={decimal} />
                        <StatLine label="Gift Card" value={paymentReceived.gift_card} decimal={decimal} />
                        <StatLine label="Paypal" value={paymentReceived.paypal} decimal={decimal} />
                        <StatLine label="Deposit" value={paymentReceived.deposit} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Payment Sent">
                        <StatLine label="Amount" value={paymentSent.amount} decimal={decimal} />
                        <StatLine label="Received" value={paymentSent.count} decimal={0} />
                        <StatLine label="Cash" value={paymentSent.cash} decimal={decimal} />
                        <StatLine label="Cheque" value={paymentSent.cheque} decimal={decimal} />
                        <StatLine label="Credit Card" value={paymentSent.credit_card} decimal={decimal} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Expense">
                        <StatLine label="Amount" value={expense} decimal={decimal} />
                        <StatLine label="Expense" value={data.total_expense} decimal={0} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Income">
                        <StatLine label="Amount" value={income} decimal={decimal} />
                        <StatLine label="Income" value={data.total_income} decimal={0} />
                    </SummaryCard>
                </div>
                <div className="col-md-3">
                    <SummaryCard title="Payroll">
                        <StatLine label="Amount" value={payroll} decimal={decimal} />
                        <StatLine label="Payroll" value={data.total_payroll} decimal={0} />
                    </SummaryCard>
                </div>
            </div>

            <div className="row g-3 mt-1 justify-content-center">
                <div className="col-md-4">
                    <SummaryCard title="Cash in Hand">
                        <StatLine label="Received" value={paymentReceived.amount} decimal={decimal} />
                        <StatLine label="Sent" value={paymentSent.amount} decimal={decimal} negative />
                        <StatLine label="Sale Return" value={ret.grand_total} decimal={decimal} negative />
                        <StatLine label="Purchase Return" value={purchaseReturn.grand_total} decimal={decimal} />
                        <StatLine label="Expense" value={expense} decimal={decimal} negative />
                        <StatLine label="Payroll" value={payroll} decimal={decimal} negative />
                        <StatLine label="In Hand" value={cashInHand} decimal={decimal} />
                    </SummaryCard>
                </div>
            </div>

            {(data.warehouses ?? []).length > 0 && (
                <div className="row g-3 mt-1">
                    {data.warehouses.map((warehouse) => {
                        const whSale = warehouse.sale ?? {};
                        const whPurchase = warehouse.purchase ?? {};
                        const whReturn = warehouse.return ?? {};
                        const whPurchaseReturn = warehouse.purchase_return ?? {};
                        const whExpense = Number(warehouse.expense ?? 0);

                        const gross =
                            Number(whSale.grand_total ?? 0)
                            - Number(whPurchase.grand_total ?? 0)
                            - Number(whReturn.grand_total ?? 0)
                            + Number(whPurchaseReturn.grand_total ?? 0);

                        const net =
                            (Number(whSale.grand_total ?? 0) - Number(whSale.tax ?? 0))
                            - (Number(whPurchase.grand_total ?? 0) - Number(whPurchase.tax ?? 0))
                            - (Number(whReturn.grand_total ?? 0) - Number(whReturn.tax ?? 0))
                            + (Number(whPurchaseReturn.grand_total ?? 0) - Number(whPurchaseReturn.tax ?? 0));

                        return (
                            <div className="col-md-4" key={warehouse.name}>
                                <SummaryCard title={warehouse.name}>
                                    <h4 className="text-center my-3">{fmt(gross)}</h4>
                                    <p className="text-center text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                                        Sale {fmt(whSale.grand_total)} - Purchase {fmt(whPurchase.grand_total)}
                                        - Sale Return {fmt(whReturn.grand_total)} + Purchase Return {fmt(whPurchaseReturn.grand_total)}
                                    </p>
                                    <hr className="my-2" />
                                    <h4 className="text-center my-3">{fmt(net)}</h4>
                                    <p className="text-center text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                                        Net Sale {fmt(Number(whSale.grand_total ?? 0) - Number(whSale.tax ?? 0))}
                                        - Net Purchase {fmt(Number(whPurchase.grand_total ?? 0) - Number(whPurchase.tax ?? 0))}
                                        - Net Sale Return {fmt(Number(whReturn.grand_total ?? 0) - Number(whReturn.tax ?? 0))}
                                        + Net Purchase Return {fmt(Number(whPurchaseReturn.grand_total ?? 0) - Number(whPurchaseReturn.tax ?? 0))}
                                    </p>
                                    <hr className="my-2" />
                                    <h4 className="text-center my-2">{fmt(whExpense)}</h4>
                                    <p className="text-center text-muted mb-0" style={{ fontSize: '0.78rem' }}>Expense</p>
                                </SummaryCard>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export { formatMoney };
