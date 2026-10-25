import { useState } from "react";
import { addBook } from "../Api";

function Bookform({ books = [], refreshData }) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [isbn, setIsbn] = useState("");
    const [quantity, setQuantity] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (saving) return;

        if (
            !title.trim() ||
            !author.trim() ||
            !genre.trim() ||
            !isbn.trim() ||
            quantity === ""
        ) {
            alert("Please fill in all fields.");
            return;
        }

        const numberQuantity = Number(quantity);

        if (
            !Number.isSafeInteger(numberQuantity) ||
            numberQuantity < 0
        ) {
            alert("Quantity must be a whole number of 0 or more.");
            return;
        }

        const duplicateISBN = books.some(
            book =>
                String(book.isbn).trim().toLowerCase() ===
                isbn.trim().toLowerCase()
        );

        if (duplicateISBN) {
            alert("A book with this ISBN already exists.");
            return;
        }

        const newBook = {
            title: title.trim(),
            author: author.trim(),
            genre: genre.trim(),
            isbn: isbn.trim(),
            quantity: numberQuantity
        };

        try {
            setSaving(true);

            // Save the book in MySQL through the backend API.
            await addBook(newBook);

            // Reload the latest books from MySQL.
            const refreshed = await refreshData();

            if (refreshed === false) {
                alert(
                    "The book was saved, but the latest data could not be loaded. Please refresh the page."
                );
                return;
            }

            setTitle("");
            setAuthor("");
            setGenre("");
            setIsbn("");
            setQuantity("");

            alert("Book added successfully.");
        } catch (error) {
            console.error("Add book error:", error);
            alert(error.message || "Unable to add the book.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="form-panel">
            <h3>Add New Book</h3>

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                    <label htmlFor="bookTitle">Title</label>
                    <input
                        id="bookTitle"
                        type="text"
                        placeholder="Enter the book title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="bookAuthor">Author</label>
                    <input
                        id="bookAuthor"
                        type="text"
                        placeholder="Enter the author name"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="bookGenre">Genre</label>
                    <input
                        id="bookGenre"
                        type="text"
                        placeholder="Enter book genre"
                        value={genre}
                        onChange={e => setGenre(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="bookISBN">ISBN</label>
                    <input
                        id="bookISBN"
                        type="text"
                        placeholder="Enter ISBN"
                        value={isbn}
                        onChange={e => setIsbn(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="bookQuantity">Initial Quantity</label>
                    <input
                        id="bookQuantity"
                        type="number"
                        placeholder="Enter initial quantity"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <div className="form-button">
                    <button
                        className="primary-btn"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Add Book"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Bookform;