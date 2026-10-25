function BookList({ books = [], onUpdate, onDelete }) {
    return (
        <div className="content-card">
            <h2>Book List</h2>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Genre</th>
                            <th>ISBN</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {books.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
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

                                    <td>
                                        <button
                                            type="button"
                                            className="update-btn"
                                            onClick={() =>
                                                onUpdate(book.id)
                                            }
                                        >
                                            Update
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() =>
                                                onDelete(book.id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BookList;