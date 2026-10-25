function TransactionList({
    transactions,
    isLibrarian
}) {
    return (
        <div className="content-card">
            <h2>Transaction History</h2>

            <div className="table-container">
                <table id="transactionTable">
                    <thead>
                        <tr>
                            <th>Book</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>User</th>
                            <th>Date</th>
                            <th>Due Date</th>
                            <th>Returned</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={8}
                                    style={{ textAlign: "center" }}
                                >
                                    No transactions recorded yet.
                                </td>
                            </tr>
                        ) : (
                            transactions.map(transaction => (
                                <tr key={transaction.id}>
                                    <td>{transaction.bookTitle}</td>

                                    <td>
                                        {transaction.type === "add"
                                            ? "Stock Added"
                                            : transaction.type === "borrow"
                                            ? "Borrow"
                                            : transaction.type === "return"
                                            ? "Return"
                                            : transaction.type}
                                    </td>

                                    <td>{transaction.quantity}</td>

                                    <td>{transaction.userName}</td>

                                    <td>{transaction.date || "-"}</td>

                                    <td>{transaction.dueDate || "-"}</td>

                                    <td>{transaction.returnedDate || "-"}</td>

                                    <td>{transaction.status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TransactionList;