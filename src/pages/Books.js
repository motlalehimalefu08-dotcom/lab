import {
    updateBook as updateBookAPI,
    deleteBook as deleteBookAPI
} from "../Api";

import BookForm from "../components/Bookform";
import BookList from "../components/BookList";

function Books({ books, transactions, refreshData }) {

    // Update an existing book.
    async function updateBook(id) {
        const book = books.find(
            item => Number(item.id) === Number(id)
        );

        if (!book) {
            alert("Book not found. Please refresh the page.");
            return;
        }

        const newTitle = prompt("Enter book title:", book.title);
        if (newTitle === null) return;

        const newAuthor = prompt("Enter author:", book.author);
        if (newAuthor === null) return;

        const newGenre = prompt("Enter genre:", book.genre);
        if (newGenre === null) return;

        const newISBN = prompt("Enter ISBN:", book.isbn);
        if (newISBN === null) return;

        if (
            !newTitle.trim() ||
            !newAuthor.trim() ||
            !newGenre.trim() ||
            !newISBN.trim()
        ) {
            alert("All fields are required.");
            return;
        }

        // Check whether another book uses the same ISBN.
        const duplicateISBN = books.some(
            item =>
                Number(item.id) !== Number(id) &&
                String(item.isbn).trim().toLowerCase() ===
                    newISBN.trim().toLowerCase()
        );

        if (duplicateISBN) {
            alert("Another book already uses this ISBN.");
            return;
        }

        try {
            await updateBookAPI(id, {
                title: newTitle.trim(),
                author: newAuthor.trim(),
                genre: newGenre.trim(),
                isbn: newISBN.trim(),
                quantity: Number(book.quantity)
            });

            const refreshed = await refreshData();

            if (refreshed === false) {
                alert(
                    "The book was updated, but the latest data could not be loaded. Please refresh the page."
                );
                return;
            }

            alert("Book updated successfully.");
        } catch (error) {
            console.error("Update book error:", error);

            alert(
                error.message || "Unable to update the book."
            );
        }
    }

    // Delete a book only if it has no transaction history.
    async function deleteBook(id) {
        const book = books.find(
            item => Number(item.id) === Number(id)
        );

        if (!book) {
            alert("Book not found. Please refresh the page.");
            return;
        }

        // Check whether the book has any transaction history.
        const hasTransactionHistory = transactions.some(
            transaction =>
                Number(transaction.bookId) === Number(id)
        );

        if (hasTransactionHistory) {
            alert(
                "This book cannot be deleted because it has transaction history. Keep the record to preserve the library's borrowing and stock history."
            );
            return;
        }

        if (
            !window.confirm(
                `Are you sure you want to delete "${book.title}"?`
            )
        ) {
            return;
        }

        try {
            await deleteBookAPI(id);

            const refreshed = await refreshData();

            if (refreshed === false) {
                alert(
                    "The book was deleted, but the latest data could not be loaded. Please refresh the page."
                );
                return;
            }

            alert("Book deleted successfully.");
        } catch (error) {
            console.error("Delete book error:", error);

            alert(
                error.message || "Unable to delete the book."
            );
        }
    }

    return (
        <main className="main-content">
            <div className="page-title">
                <h2>Book Management</h2>
                <p>Add, update and delete books.</p>
            </div>

            <BookForm
                books={books}
                refreshData={refreshData}
            />

            <BookList
                books={books}
                onUpdate={updateBook}
                onDelete={deleteBook}
            />
        </main>
    );
}

export default Books;