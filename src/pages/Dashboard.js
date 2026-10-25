import LibrarianDashboard from "../components/LibrarianDashboard";
import MemberDashboard from "../components/MemberDashboard";

function Dashboard({ books, users, transactions, loggedInUser }) {
    const isLibrarian = loggedInUser.role === "Librarian";

    return (
        <main className="main-content">
            <div className="page-title">
                <h2>Dashboard</h2>
                <p>Welcome to Thabong Community Library.</p>
            </div>

            {isLibrarian ? (
                <LibrarianDashboard
                    books={books}
                    users={users}
                    transactions={transactions}
                />
            ) : (
                <MemberDashboard
                    books={books}
                    transactions={transactions}
                    loggedInUser={loggedInUser}
                />
            )}
        </main>
    );
}

export default Dashboard;