
import { useCallback, useEffect, useState } from "react";
import {
    Routes,
    Route,
    Navigate,
    useNavigate
} from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Transactions from "./pages/Transactions";
import Users from "./pages/Users";

import {
    getBooks,
    getUsers,
    getTransactions
} from "./Api";

function App() {
    const navigate = useNavigate();

    // Store data retrieved from MySQL.
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Store the logged-in user.
    const [loggedInUser, setLoggedInUser] = useState(null);

    // Track loading and API errors.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load the latest library data from the backend.
    const refreshData = useCallback(async () => {
        try {
            const [
                booksData,
                usersData,
                transactionsData
            ] = await Promise.all([
                getBooks(),
                getUsers(),
                getTransactions()
            ]);

            setBooks(booksData);
            setUsers(usersData);
            setTransactions(transactionsData);
            setError("");

            return true;
        } catch (err) {
            setError(
                err.message || "Unable to load library data."
            );

            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Load database records when the application starts.
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Restore the saved session only after users are loaded.
    useEffect(() => {
        if (loading || error) {
            return;
        }

        const savedSession =
            localStorage.getItem("loggedInUser");

        if (!savedSession) {
            return;
        }

        try {
            const savedUser = JSON.parse(savedSession);

            const currentUser = users.find(
                user =>
                    Number(user.id) === Number(savedUser.id)
            );

            if (
                currentUser &&
                currentUser.role === savedUser.role &&
                Number.isSafeInteger(Number(currentUser.id)) &&
                Number(currentUser.id) > 0
            ) {
                setLoggedInUser({
                    ...currentUser,
                    id: Number(currentUser.id)
                });
            } else {
                localStorage.removeItem("loggedInUser");
                setLoggedInUser(null);
            }
        } catch {
            localStorage.removeItem("loggedInUser");
            setLoggedInUser(null);
        }
    }, [loading, error, users]);

    // Log in using a user account retrieved from MySQL.
    function login(membershipId, role) {
        const enteredMembershipId =
            String(membershipId).trim().toLowerCase();

        const user = users.find(
            item =>
                String(item.membershipId)
                    .trim()
                    .toLowerCase() === enteredMembershipId &&
                item.role === role
        );

        if (!user) {
            return false;
        }

        const userId = Number(user.id);

        // Accept only a valid MySQL user ID.
        if (
            !Number.isSafeInteger(userId) ||
            userId < 1
        ) {
            return false;
        }

        const validUser = {
            ...user,
            id: userId
        };

        setLoggedInUser(validUser);

        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(validUser)
        );

        navigate("/dashboard");

        return true;
    }

    // Log out the current user.
    function logout() {
        setLoggedInUser(null);
        localStorage.removeItem("loggedInUser");
        navigate("/login");
    }

    // Update the saved session when the current user is updated.
    function updateLoggedInUser(updatedUser) {
        const userId = Number(updatedUser.id);

        if (
            !Number.isSafeInteger(userId) ||
            userId < 1
        ) {
            return;
        }

        const validUser = {
            ...updatedUser,
            id: userId
        };

        setLoggedInUser(validUser);

        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(validUser)
        );
    }

    // Show a loading message while retrieving records.
    if (loading) {
        return (
            <div className="page-container">
                Loading library data...
            </div>
        );
    }

    // Display an error if the backend cannot be reached.
    if (error) {
        return (
            <div className="page-container">
                <h2>Unable to Load Library Data</h2>

                <p>{error}</p>

                <p>
                    Make sure your backend server and MySQL
                    database are running.
                </p>

                <button onClick={refreshData}>
                    Try Again
                </button>
            </div>
        );
    }

    // Display the login page when no user is logged in.
    if (!loggedInUser) {
        return (
            <Routes>
                <Route
                    path="/login"
                    element={
                        <Login
                            users={users}
                            login={login}
                        />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />
            </Routes>
        );
    }

    return (
        <>
            <Navbar
                loggedInUser={loggedInUser}
                logout={logout}
            />

            <Routes>
                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <Dashboard
                            books={books}
                            users={users}
                            transactions={transactions}
                            loggedInUser={loggedInUser}
                        />
                    }
                />

                {/* Book management: Librarian only */}
                <Route
                    path="/books"
                    element={
                        loggedInUser.role === "Librarian" ? (
                            <Books
                                books={books}
                                setBooks={setBooks}
                                transactions={transactions}
                                refreshData={refreshData}
                            />
                        ) : (
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        )
                    }
                />

                {/* Borrowing, returning and stock transactions */}
                <Route
                    path="/transactions"
                    element={
                        <Transactions
                            books={books}
                            setBooks={setBooks}
                            transactions={transactions}
                            setTransactions={setTransactions}
                            loggedInUser={loggedInUser}
                            refreshData={refreshData}
                        />
                    }
                />

                {/* User management: Librarian only */}
                <Route
                    path="/users"
                    element={
                        loggedInUser.role === "Librarian" ? (
                            <Users
                                users={users}
                                setUsers={setUsers}
                                transactions={transactions}
                                loggedInUser={loggedInUser}
                                updateLoggedInUser={updateLoggedInUser}
                                refreshData={refreshData}
                            />
                        ) : (
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        )
                    }
                />

                {/* Redirect login and unknown pages */}
                <Route
                    path="/login"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />
            </Routes>

            <footer className="footer">
                ©Making Knowledge Accessible To Everyone
            </footer>
        </>
    );
}

export default App;
