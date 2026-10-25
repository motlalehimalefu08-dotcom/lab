
import { useState } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";

import {
    addTransaction,
    deleteTransaction as deleteTransactionAPI,
    getBooks,
    getTransactions
} from "../Api";

function Transactions({
    books,
    setBooks,
    transactions,
    setTransactions,
    loggedInUser,
    refreshData: refreshAppData
}) {
    const isLibrarian = loggedInUser?.role === "Librarian";

    const [transactionBook, setTransactionBook] = useState("");
    const [transactionType, setTransactionType] = useState("");
    const [transactionQuantity, setTransactionQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);

    // Find the logged-in user's active borrowed book.
    const activeBorrow = transactions.find(
        transaction =>
            Number(transaction.userId) === Number(loggedInUser?.id) &&
            transaction.type === "borrow" &&
            transaction.status === "Borrowed"
    );

    // Only books with at least two copies can be borrowed.
    const availableBooks = books.filter(
        book => Number(book.quantity) >= 2
    );

    // Validate the logged-in user's database ID.
    function hasValidUser() {
        const userId = Number(loggedInUser?.id);

        if (
            !Number.isSafeInteger(userId) ||
            userId < 1 ||
            !loggedInUser?.name ||
            !loggedInUser?.membershipId
        ) {
            alert(
                "Your account details are invalid. Please log out and log in again."
            );

            return false;
        }

        return true;
    }

    // Reset the transaction form.
    function resetForm() {
        setTransactionBook("");
        setTransactionType("");
        setTransactionQuantity(1);
    }

    // Reset the selected book and quantity when the action changes.
    function handleTypeChange(e) {
        setTransactionType(e.target.value);
        setTransactionBook("");
        setTransactionQuantity(1);
    }

    // Refresh books and transactions from the backend.
    async function refreshLibraryData() {
        try {
            if (refreshAppData) {
                const success = await refreshAppData();

                if (success === false) {
                    throw new Error(
                        "The library data could not be refreshed."
                    );
                }
            } else {
                const [updatedBooks, updatedTransactions] =
                    await Promise.all([
                        getBooks(),
                        getTransactions()
                    ]);

                setBooks(updatedBooks);
                setTransactions(updatedTransactions);
            }

            return true;
        } catch (error) {
            console.error("Refresh error:", error);

            alert(
                "The transaction may have been saved, but the latest data could not be loaded. Please refresh the page."
            );

            return false;
        }
    }

    // Process the selected transaction.
    async function handleSubmit(e) {
        e.preventDefault();

        if (processing) {
            return;
        }

        if (!hasValidUser()) {
            return;
        }

        setProcessing(true);

        try {
            if (isLibrarian) {
                if (transactionType !== "add") {
                    alert("Only the Librarian can add stock.");
                    return;
                }

                await addStock();
            } else if (transactionType === "borrow") {
                await borrowBook();
            } else if (transactionType === "return") {
                await returnBook();
            } else {
                alert("Please select an action.");
            }
        } catch (error) {
            console.error("Transaction error:", error);

            alert(
                error.message || "The transaction could not be completed."
            );
        } finally {
            setProcessing(false);
        }
    }

    // Librarians can add stock to the library.
    async function addStock() {
        if (!transactionBook || transactionQuantity === "") {
            alert("Please select a book and enter a quantity.");
            return;
        }

        const amount = Number(transactionQuantity);

        if (!Number.isSafeInteger(amount) || amount < 1) {
            alert("Quantity must be a whole number greater than zero.");
            return;
        }

        const book = books.find(
            item => Number(item.id) === Number(transactionBook)
        );

        if (!book) {
            alert("Book not found. Please refresh the page.");
            return;
        }

        await addTransaction({
            bookId: Number(book.id),
            bookTitle: book.title,
            type: "add",
            quantity: amount,
            userId: Number(loggedInUser.id),
            userName: loggedInUser.name,
            membershipId: loggedInUser.membershipId
        });

        resetForm();

        const refreshed = await refreshLibraryData();

        if (refreshed) {
            alert("Stock added successfully.");
        }
    }

    // Users can borrow one book at a time.
    async function borrowBook() {
        if (isLibrarian) {
            alert("Only Users can borrow books.");
            return;
        }

        if (activeBorrow) {
            alert("You already have a borrowed book. Return it first.");
            return;
        }

        if (!transactionBook) {
            alert("Please select a book.");
            return;
        }

        const book = books.find(
            item => Number(item.id) === Number(transactionBook)
        );

        if (!book) {
            alert("Book not found. Please refresh the page.");
            return;
        }

        if (Number(book.quantity) < 2) {
            alert("This book is not available for borrowing.");
            return;
        }

        await addTransaction({
            bookId: Number(book.id),
            bookTitle: book.title,
            type: "borrow",
            quantity: 1,
            userId: Number(loggedInUser.id),
            userName: loggedInUser.name,
            membershipId: loggedInUser.membershipId
        });

        resetForm();

        const refreshed = await refreshLibraryData();

        if (refreshed) {
            alert("Book borrowed successfully. It is due in 7 days.");
        }
    }

    // Users can return their currently borrowed book.
    async function returnBook() {
        if (isLibrarian) {
            alert("Only Users can return books.");
            return;
        }

        if (!activeBorrow) {
            alert("You have no borrowed book to return.");
            return;
        }

        await addTransaction({
            bookId: Number(activeBorrow.bookId),
            bookTitle: activeBorrow.bookTitle,
            type: "return",
            quantity: 1,
            userId: Number(loggedInUser.id),
            userName: loggedInUser.name,
            membershipId: loggedInUser.membershipId
        });

        resetForm();

        const refreshed = await refreshLibraryData();

        if (refreshed) {
            alert("Book returned successfully.");
        }
    }

    // Only the Librarian can delete transaction history entries.
    async function deleteTransaction(id) {
        if (!isLibrarian) {
            alert("Only the Librarian can delete transactions.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await deleteTransactionAPI(id);

            const refreshed = await refreshLibraryData();

            if (refreshed) {
                alert("Transaction deleted successfully.");
            }
        } catch (error) {
            console.error("Delete transaction error:", error);

            alert(
                error.message || "Failed to delete the transaction."
            );
        }
    }

    // Librarians see all transactions; Users see only their own.
    const displayedTransactions = isLibrarian
        ? transactions
        : transactions.filter(
            transaction =>
                Number(transaction.userId) === Number(loggedInUser?.id)
        );

    return (
        <main className="main-content">
            <div className="page-title">
                <h2>Transactions</h2>
                <p>View and record book transactions.</p>
            </div>

            <TransactionForm
                isLibrarian={isLibrarian}
                books={books}
                availableBooks={availableBooks}
                transactionBook={transactionBook}
                setTransactionBook={setTransactionBook}
                transactionType={transactionType}
                handleTypeChange={handleTypeChange}
                transactionQuantity={transactionQuantity}
                setTransactionQuantity={setTransactionQuantity}
                activeBorrow={activeBorrow}
                onSubmit={handleSubmit}
                processing={processing}
            />

            <TransactionList
                transactions={displayedTransactions}
                isLibrarian={isLibrarian}
                onDelete={deleteTransaction}
            />
        </main>
    );
}

export default Transactions;
