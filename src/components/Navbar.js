import { Link } from "react-router-dom";

function Navbar({ loggedInUser, logout }) {
    const isLibrarian = loggedInUser.role === "Librarian";

    return (
        <>
            <header className="main-header">
                <div>
                    <h1>Thabong Community Library</h1>
                    <p>
                        Welcome, {loggedInUser.name} ({loggedInUser.role})
                    </p>
                </div>

                <button className="logout-btn" onClick={logout}>
                    Logout
                </button>
            </header>

            <nav className="navigation">
                <Link to="/dashboard">
                    <button>Dashboard</button>
                </Link>

                {isLibrarian && (
                    <Link to="/books">
                        <button>Books</button>
                    </Link>
                )}

                <Link to="/transactions">
                    <button>Transactions</button>
                </Link>

                {isLibrarian && (
                    <Link to="/users">
                        <button>Users</button>
                    </Link>
                )}
            </nav>
        </>
    );
}

export default Navbar;