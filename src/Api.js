
const API_URL = "https://thabong-library-api.onrender.com/api";

// Send requests to the backend and handle responses.
async function request(endpoint, options = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to the library backend. Please try again later."
        );
    }

    // Read the response returned by the backend.
    const data = await response.json().catch(() => ({}));

    // Display an error if the request fails.
    if (!response.ok) {
        throw new Error(
            data.error || data.message || "The request failed."
        );
    }

    return data;
}

//BOOK MANAGEMENT 

// Get all books.
export const getBooks = () => request("/books");

// Add a new book.
export const addBook = book =>
    request("/books", {
        method: "POST",
        body: JSON.stringify(book)
    });

// Update an existing book.
export const updateBook = (id, book) =>
    request(`/books/${id}`, {
        method: "PUT",
        body: JSON.stringify(book)
    });

// Delete a book.
export const deleteBook = id =>
    request(`/books/${id}`, {
        method: "DELETE"
    });

// USER MANAGEMENT

// Get all users.
export const getUsers = () => request("/users");

// Add a new user.
export const addUser = user =>
    request("/users", {
        method: "POST",
        body: JSON.stringify(user)
    });

// Update an existing user.
export const updateUser = (id, user) =>
    request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(user)
    });

// Delete a user.
export const deleteUser = id =>
    request(`/users/${id}`, {
        method: "DELETE"
    });

// TRANSACTION MANAGEMENT 

// Get all transactions.
export const getTransactions = () =>
    request("/transactions");

// Add stock, borrow a book, or return a book.
export const addTransaction = transaction =>
    request("/transactions", {
        method: "POST",
        body: JSON.stringify(transaction)
    });

// Delete a transaction.
export const deleteTransaction = id =>
    request(`/transactions/${id}`, {
        method: "DELETE"
    });
