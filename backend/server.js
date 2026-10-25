
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// VALIDATION HELPERS

function validId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0;
}

function validQuantity(value, allowZero = false) {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        typeof value === "boolean"
    ) {
        return false;
    }

    const quantity = Number(value);

    return (
        Number.isSafeInteger(quantity) &&
        (allowZero ? quantity >= 0 : quantity > 0)
    );
}

function handleError(res, error, message) {
    console.error(message, error.message);

    if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            error: "A record with those details already exists."
        });
    }

    if (
        error.code === "ER_NO_REFERENCED_ROW_2" ||
        error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
        return res.status(409).json({
            error: "This record is linked to other records and cannot be changed or deleted."
        });
    }

    return res.status(500).json({
        error: message
    });
}

// HOME ROUTE

app.get("/", (req, res) => {
    res.status(200).send(
        "Thabong Community Library Backend is running."
    );
});

// HEALTH CHECK

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "success",
            backend: "Running",
            database: "Connected",
            message: "Thabong Community Library API is running."
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(503).json({
            status: "error",
            backend: "Running",
            database: "Disconnected",
            message: "The backend is running, but the database connection failed."
        });
    }
});

// BOOK MANAGEMENT

// Get all books.
app.get("/api/books", async (req, res) => {
    try {
        const [books] = await pool.query(
            "SELECT * FROM books ORDER BY id DESC"
        );

        res.json(books);
    } catch (error) {
        handleError(res, error, "Could not load books.");
    }
});

// Add a book.
app.post("/api/books", async (req, res) => {
    const { title, author, genre, isbn, quantity } = req.body;

    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof author !== "string" ||
        !author.trim() ||
        typeof genre !== "string" ||
        !genre.trim() ||
        typeof isbn !== "string" ||
        !isbn.trim() ||
        !validQuantity(quantity, true)
    ) {
        return res.status(400).json({
            error: "Enter all book details and a valid quantity."
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO books
            (title, author, genre, isbn, quantity)
            VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                author.trim(),
                genre.trim(),
                isbn.trim(),
                Number(quantity)
            ]
        );

        const [rows] = await pool.query(
            "SELECT * FROM books WHERE id = ?",
            [result.insertId]
        );

        return res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "A book with this ISBN already exists."
            });
        }

        return handleError(res, error, "Could not add the book.");
    }
});

// Update a book.
app.put("/api/books/:id", async (req, res) => {
    const { title, author, genre, isbn, quantity } = req.body;
    const id = req.params.id;

    if (!validId(id)) {
        return res.status(400).json({
            error: "Invalid book ID."
        });
    }

    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof author !== "string" ||
        !author.trim() ||
        typeof genre !== "string" ||
        !genre.trim() ||
        typeof isbn !== "string" ||
        !isbn.trim() ||
        !validQuantity(quantity, true)
    ) {
        return res.status(400).json({
            error: "Enter all book details and a valid quantity."
        });
    }

    const qty = Number(quantity);
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Lock the book while checking and updating it.
        const [existingBooks] = await connection.query(
            "SELECT id FROM books WHERE id = ? FOR UPDATE",
            [id]
        );

        if (existingBooks.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "Book not found."
            });
        }

        // Calculate copies that are currently borrowed.
        const [activeBorrows] = await connection.query(
            `SELECT COALESCE(SUM(quantity), 0) AS borrowed
             FROM transactions
             WHERE bookId = ?
             AND type = 'borrow'
             AND status = 'Borrowed'`,
            [id]
        );

        const borrowed = Number(activeBorrows[0].borrowed);

        if (qty < borrowed) {
            await connection.rollback();

            return res.status(409).json({
                error: "Quantity cannot be less than the number of copies currently borrowed."
            });
        }

        await connection.query(
            `UPDATE books
             SET title = ?, author = ?, genre = ?, isbn = ?, quantity = ?
             WHERE id = ?`,
            [
                title.trim(),
                author.trim(),
                genre.trim(),
                isbn.trim(),
                qty,
                id
            ]
        );

        const [updatedBooks] = await connection.query(
            "SELECT * FROM books WHERE id = ?",
            [id]
        );

        await connection.commit();

        return res.json(updatedBooks[0]);
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Update rollback error:",
                    rollbackError.message
                );
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "That ISBN is already in use."
            });
        }

        console.error("Update book error:", error.message);

        return res.status(500).json({
            error: "Could not update the book."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Delete a book only when it has no transaction history.
app.delete("/api/books/:id", async (req, res) => {
    const id = req.params.id;
    let connection;

    if (!validId(id)) {
        return res.status(400).json({
            error: "Invalid book ID."
        });
    }

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [books] = await connection.query(
            "SELECT id FROM books WHERE id = ? FOR UPDATE",
            [id]
        );

        if (books.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "Book not found."
            });
        }

        const [history] = await connection.query(
            "SELECT id FROM transactions WHERE bookId = ? LIMIT 1",
            [id]
        );

        if (history.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                error: "This book has transaction history and cannot be deleted. Keep the record to preserve the library history."
            });
        }

        await connection.query(
            "DELETE FROM books WHERE id = ?",
            [id]
        );

        await connection.commit();

        return res.json({
            message: "Book deleted successfully."
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Delete rollback error:",
                    rollbackError.message
                );
            }
        }

        console.error("Delete book error:", error.message);

        return res.status(500).json({
            error: "Could not delete the book."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// USER MANAGEMENT

// Get all users.
app.get("/api/users", async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, name, membershipId, role
             FROM users
             ORDER BY id DESC`
        );

        res.json(users);
    } catch (error) {
        handleError(res, error, "Could not load users.");
    }
});

// Add a user.
app.post("/api/users", async (req, res) => {
    const { name, membershipId, role } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof membershipId !== "string" ||
        !membershipId.trim() ||
        !["Librarian", "User"].includes(role)
    ) {
        return res.status(400).json({
            error: "Enter a name, Membership ID and valid role."
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO users (name, membershipId, role)
             VALUES (?, ?, ?)`,
            [name.trim(), membershipId.trim(), role]
        );

        const [rows] = await pool.query(
            `SELECT id, name, membershipId, role
             FROM users WHERE id = ?`,
            [result.insertId]
        );

        return res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "That Membership ID already exists."
            });
        }

        return handleError(res, error, "Could not add the user.");
    }
});

// Update a user.
app.put("/api/users/:id", async (req, res) => {
    const { name, membershipId, role } = req.body;
    const id = req.params.id;

    if (!validId(id)) {
        return res.status(400).json({
            error: "Invalid user ID."
        });
    }

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof membershipId !== "string" ||
        !membershipId.trim() ||
        !["Librarian", "User"].includes(role)
    ) {
        return res.status(400).json({
            error: "Enter valid user details."
        });
    }

    try {
        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE id = ?",
            [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                error: "User not found."
            });
        }

        await pool.query(
            `UPDATE users
             SET name = ?, membershipId = ?, role = ?
             WHERE id = ?`,
            [
                name.trim(),
                membershipId.trim(),
                role,
                id
            ]
        );

        const [rows] = await pool.query(
            `SELECT id, name, membershipId, role
             FROM users WHERE id = ?`,
            [id]
        );

        return res.json(rows[0]);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "That Membership ID already exists."
            });
        }

        return handleError(res, error, "Could not update the user.");
    }
});

// Delete a user only if they have no active borrowed book.
// Preserve transaction history by setting userId to NULL.
app.delete("/api/users/:id", async (req, res) => {
    const id = req.params.id;
    let connection;

    if (!validId(id)) {
        return res.status(400).json({
            error: "Invalid user ID."
        });
    }

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query(
            "SELECT id FROM users WHERE id = ? FOR UPDATE",
            [id]
        );

        if (users.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "User not found."
            });
        }

        const [active] = await connection.query(
            `SELECT id FROM transactions
             WHERE userId = ?
             AND type = 'borrow'
             AND status = 'Borrowed'
             LIMIT 1
             FOR UPDATE`,
            [id]
        );

        if (active.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                error: "This user must return their borrowed book first."
            });
        }

        await connection.query(
            "UPDATE transactions SET userId = NULL WHERE userId = ?",
            [id]
        );

        await connection.query(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        await connection.commit();

        return res.json({
            message: "User deleted successfully."
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "User deletion rollback error:",
                    rollbackError.message
                );
            }
        }

        return handleError(res, error, "Could not delete the user.");
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// TRANSACTION HISTORY

// Get transaction history.
app.get("/api/transactions", async (req, res) => {
    try {
        const [transactions] = await pool.query(
            "SELECT * FROM transactions ORDER BY date DESC, id DESC"
        );

        res.json(transactions);
    } catch (error) {
        handleError(res, error, "Could not load transactions.");
    }
});

// ADD STOCK, BORROW OR RETURN

app.post("/api/transactions", async (req, res) => {
    const {
        bookId,
        type,
        quantity,
        userId,
        userName,
        membershipId
    } = req.body;

    if (!["add", "borrow", "return"].includes(type)) {
        return res.status(400).json({
            error: "Select a valid transaction type."
        });
    }

    if (!validId(userId)) {
        return res.status(400).json({
            error: "Invalid user ID. Please log out and sign in again using an existing library account."
        });
    }

    if (
        typeof userName !== "string" ||
        !userName.trim() ||
        typeof membershipId !== "string" ||
        !membershipId.trim()
    ) {
        return res.status(400).json({
            error: "Valid user details are required."
        });
    }

    if (!validQuantity(quantity)) {
        return res.status(400).json({
            error: "Quantity must be a positive whole number."
        });
    }

    const qty = Number(quantity);

    if (type !== "return" && !validId(bookId)) {
        return res.status(400).json({
            error: "Please select a valid book."
        });
    }

    if (type !== "add" && qty !== 1) {
        return res.status(400).json({
            error: "Borrowing and returning must use a quantity of one."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Confirm the user exists and use the database role.
        const [users] = await connection.query(
            `SELECT id, name, membershipId, role
             FROM users
             WHERE id = ?
             FOR UPDATE`,
            [userId]
        );

        if (users.length === 0) {
            throw new Error(
                "This user does not exist in the database. Please sign in again."
            );
        }

        const user = users[0];

        if (
            String(user.membershipId) !== String(membershipId) ||
            String(user.name) !== String(userName)
        ) {
            throw new Error(
                "The signed-in user details do not match the database. Please sign in again."
            );
        }

        if (type === "add" && user.role !== "Librarian") {
            throw new Error("Only the Librarian can add stock.");
        }

        if (type !== "add" && user.role !== "User") {
            throw new Error(
                "Only a library User can borrow or return books."
            );
        }

        if (type === "return") {
            // Find the user's currently borrowed book.
            const [active] = await connection.query(
                `SELECT *
                 FROM transactions
                 WHERE userId = ?
                 AND type = 'borrow'
                 AND status = 'Borrowed'
                 ORDER BY id DESC
                 LIMIT 1
                 FOR UPDATE`,
                [userId]
            );

            if (active.length === 0) {
                throw new Error("You have no book to return.");
            }

            const borrowed = active[0];

            const [books] = await connection.query(
                "SELECT * FROM books WHERE id = ? FOR UPDATE",
                [borrowed.bookId]
            );

            if (books.length === 0) {
                throw new Error("The borrowed book no longer exists.");
            }

            const book = books[0];

            // Restore the returned copy.
            await connection.query(
                "UPDATE books SET quantity = quantity + 1 WHERE id = ?",
                [book.id]
            );

            // Mark the original borrowing record as returned.
            await connection.query(
                `UPDATE transactions
                 SET status = 'Returned', returnedDate = CURDATE()
                 WHERE id = ?`,
                [borrowed.id]
            );

            // Record the return in transaction history.
            await connection.query(
                `INSERT INTO transactions
                 (bookId, bookTitle, type, quantity, userId, userName,
                  membershipId, dueDate, returnedDate, status)
                 VALUES (?, ?, 'return', 1, ?, ?, ?, '-', CURDATE(), 'Returned')`,
                [
                    book.id,
                    book.title,
                    user.id,
                    user.name,
                    user.membershipId
                ]
            );
        } else {
            const [books] = await connection.query(
                "SELECT * FROM books WHERE id = ? FOR UPDATE",
                [bookId]
            );

            if (books.length === 0) {
                throw new Error("Book not found.");
            }

            const book = books[0];

            if (type === "add") {
                // Add new copies to existing stock.
                await connection.query(
                    "UPDATE books SET quantity = quantity + ? WHERE id = ?",
                    [qty, book.id]
                );

                await connection.query(
                    `INSERT INTO transactions
                     (bookId, bookTitle, type, quantity, userId, userName,
                      membershipId, dueDate, returnedDate, status)
                     VALUES (?, ?, 'add', ?, ?, ?, ?, '-', '-', 'Added')`,
                    [
                        book.id,
                        book.title,
                        qty,
                        user.id,
                        user.name,
                        user.membershipId
                    ]
                );
            }

            if (type === "borrow") {
                if (Number(book.quantity) < 2) {
                    throw new Error(
                        "At least two copies must be available to borrow."
                    );
                }

                // A user may have only one active borrowing at a time.
                const [active] = await connection.query(
                    `SELECT id
                     FROM transactions
                     WHERE userId = ?
                     AND type = 'borrow'
                     AND status = 'Borrowed'
                     LIMIT 1
                     FOR UPDATE`,
                    [user.id]
                );

                if (active.length > 0) {
                    throw new Error(
                        "Return your current book before borrowing another."
                    );
                }

                await connection.query(
                    "UPDATE books SET quantity = quantity - 1 WHERE id = ?",
                    [book.id]
                );

                await connection.query(
                    `INSERT INTO transactions
                     (bookId, bookTitle, type, quantity, userId, userName,
                      membershipId, dueDate, returnedDate, status)
                     VALUES (?, ?, 'borrow', 1, ?, ?, ?,
                     DATE_ADD(CURDATE(), INTERVAL 7 DAY), '-', 'Borrowed')`,
                    [
                        book.id,
                        book.title,
                        user.id,
                        user.name,
                        user.membershipId
                    ]
                );
            }
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message:
                type === "add"
                    ? "Stock added successfully."
                    : type === "borrow"
                        ? "Book borrowed successfully."
                        : "Book returned successfully."
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Transaction rollback error:",
                    rollbackError.message
                );
            }
        }

        console.error("Transaction error:", error.message);

        const status = error.code === "ER_DUP_ENTRY" ? 409 : 400;

        return res.status(status).json({
            error: error.message || "Could not process the transaction."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// DELETE TRANSACTION HISTORY

// Protect records that affect stock or borrowing history.
app.delete("/api/transactions/:id", async (req, res) => {
    const id = req.params.id;

    if (!validId(id)) {
        return res.status(400).json({
            error: "Invalid transaction ID."
        });
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, type, status FROM transactions WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "Transaction not found."
            });
        }

        const transaction = rows[0];

        if (
            ["borrow", "return", "add"].includes(transaction.type)
        ) {
            return res.status(409).json({
                error: "This transaction affects stock or borrowing history and cannot be deleted directly."
            });
        }

        await pool.query(
            "DELETE FROM transactions WHERE id = ?",
            [id]
        );

        return res.json({
            message: "Transaction deleted successfully."
        });
    } catch (error) {
        return handleError(
            res,
            error,
            "Could not delete the transaction."
        );
    }
});

// UNKNOWN API ROUTES

app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API endpoint not found."
    });
});

// UNKNOWN PAGE ROUTES

app.use((req, res) => {
    res.status(404).send(
        "Page not found. Visit /api/health to check the backend."
    );
});

// START THE SERVER

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
