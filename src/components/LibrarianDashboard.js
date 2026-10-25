import React from "react";

function LibrarianDashboard({
    books = [],
    transactions = [],
    users = []
}) {
    // Calculate the total number of available copies.
    const totalBooks = books.reduce(
        (total, book) => total + Number(book.quantity || 0),
        0
    );

    // Find books with fewer than two copies.
    const lowStock = books.filter(
        book => Number(book.quantity) < 2
    );

    return (
        <>
            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <h3>Total Books</h3>
                    <p>{books.length}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Available Copies</h3>
                    <p>{totalBooks}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Low Stock</h3>
                    <p>{lowStock.length}</p>
                </div>

                <div className="dashboard-card">
                    <h3>Total Users</h3>
                    <p>{users.length}</p>
                </div>
            </div>

            <div className="content-card">
                <h3>Current Book Availability</h3>

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
                            {books.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        style={{ textAlign: "center" }}
                                    >
                                        No books available.
                                    </td>
                                </tr>
                            ) : (
                                books.map(book => (
                                    <tr
                                        key={book.id}
                                        className={
                                            Number(book.quantity) < 2
                                                ? "low-stock"
                                                : ""
                                        }
                                    >
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
        </>
    );
}

export default LibrarianDashboard;