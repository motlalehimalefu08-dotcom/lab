function TransactionForm({
    isLibrarian,
    books,
    availableBooks,
    transactionBook,
    setTransactionBook,
    transactionType,
    handleTypeChange,
    transactionQuantity,
    setTransactionQuantity,
    activeBorrow,
    onSubmit,
    processing
}) {
    const displayedBooks = isLibrarian ? books : availableBooks;

    return (
        <div className="form-panel">
            <h2>Record Transaction</h2>

            <form onSubmit={onSubmit} className="form-grid">
                <div className="form-group">
                    <label htmlFor="transactionBook">Book</label>

                    <select
                        id="transactionBook"
                        value={transactionBook}
                        onChange={e => setTransactionBook(e.target.value)}
                        required
                        disabled={processing}
                    >
                        <option value="">Select Book</option>

                        {displayedBooks.map(book => (
                            <option key={book.id} value={book.id}>
                                {book.title} ({book.quantity} available)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="transactionType">
                        Transaction Type
                    </label>

                    <select
                        id="transactionType"
                        value={transactionType}
                        onChange={handleTypeChange}
                        required
                        disabled={processing}
                    >
                        <option value="">Select Type</option>

                        {isLibrarian ? (
                            <option value="add">Add Stock</option>
                        ) : (
                            <>
                                <option
                                    value="borrow"
                                    disabled={!!activeBorrow}
                                >
                                    Borrow Book
                                </option>

                                <option
                                    value="return"
                                    disabled={!activeBorrow}
                                >
                                    Return Book
                                </option>
                            </>
                        )}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="transactionQuantity">
                        {isLibrarian ? "Quantity to Add" : "Quantity"}
                    </label>

                    <input
                        id="transactionQuantity"
                        type="number"
                        min="1"
                        step="1"
                        placeholder={
                            isLibrarian
                                ? "Enter quantity to add"
                                : "1 book per transaction"
                        }
                        max={isLibrarian ? undefined : 1}
                        value={transactionQuantity}
                        onChange={e =>
                            setTransactionQuantity(e.target.value)
                        }
                        readOnly={!isLibrarian}
                        required
                        disabled={processing}
                    />
                </div>

                <div className="form-button">
                    <button
                        className="primary-btn"
                        type="submit"
                        disabled={
                            processing ||
                            !transactionType ||
                            !transactionBook ||
                            (
                                isLibrarian &&
                                (
                                    transactionQuantity === "" ||
                                    !Number.isSafeInteger(
                                        Number(transactionQuantity)
                                    ) ||
                                    Number(transactionQuantity) < 1
                                )
                            )
                        }
                    >
                        {processing
                            ? "Processing..."
                            : "Process Transaction"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TransactionForm;