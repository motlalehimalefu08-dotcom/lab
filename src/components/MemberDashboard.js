
import React from "react";

function MemberDashboard({
    books,
    transactions,
    loggedInUser
}) {
    // Get transactions belonging to the logged-in user.
    const myTransactions = transactions.filter(
        transaction =>
            Number(transaction.userId) === Number(loggedInUser?.id)
    );

    // Find the user's currently borrowed book.
    const activeBorrow = myTransactions.find(
        transaction =>
            transaction.type === "borrow" &&
            transaction.status === "Borrowed"
    );

    // Only show books with at least two copies available.
    const availableBooks = books.filter(
        book => Number(book.quantity) >= 2
    );

    return (
        <div id="memberDashboard">
            <div className="content-card">
                <h2>My Library</h2>

                {activeBorrow ? (
                    <>
                        <p>
                            <strong>Borrowed Book:</strong>{" "}
                            {activeBorrow.bookTitle}
                        </p>

                        <p>
                            <strong>Borrow Date:</strong>{" "}
                            {activeBorrow.date || "-"}
                        </p>

                        <p>
                            <strong>Due Date:</strong>{" "}
                            {activeBorrow.dueDate || "-"}
                        </p>

                        <p>
                            <strong>Status:</strong>{" "}
                            {activeBorrow.status}
                        </p>
                    </>
                ) : (
                    <p>
                        You currently have no borrowed books.
                    </p>
                )}
            </div>

            <div className="content-card">
                <h2>Available Books</h2>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Genre</th>
                                <th>ISBN</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>

                        <tbody>
                            {availableBooks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center" }}>
                                        No books currently available
                                        for borrowing.
                                    </td>
                                </tr>
                            ) : (
                                availableBooks.map(book => (
                                    <tr key={book.id}>
                                        <td>{book.title}</td>
                                        <td>{book.author}</td>
                                        <td>{book.genre}</td>
                                        <td>{book.isbn}</td>
                                        <td>{book.quantity}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default MemberDashboard;
