import { useState } from "react";

function Login({ login }) {
    const [membershipId, setMembershipId] = useState("");
    const [role, setRole] = useState("");
    const [message, setMessage] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (!membershipId.trim() || !role) {
            setMessage("Please enter your Membership ID and select a role.");
            return;
        }

        const success = login(membershipId.trim(), role);

        if (!success) {
            setMessage("Invalid Membership ID or role.");
        } else {
            setMessage("");
        }
    }

    return (
        <div className="login-screen">
            <div className="login-box">
                <h1>Thabong Community Library</h1>

                <form onSubmit={handleSubmit}>
                    <label>Membership ID</label>
                    <input
                        type="text"
                        placeholder="Enter Membership ID"
                        value={membershipId}
                        onChange={(e) => setMembershipId(e.target.value)}
                    />

                    <label>Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="">Select Role</option>
                        <option value="Librarian">Librarian</option>
                        <option value="User">User</option>
                    </select>

                    <button type="submit">Login</button>
                </form>

                {message && (
                    <p className="login-message error">
                        {message}
                    </p>
                )}

                <div className="login-note">
                    <strong>Accounts are created by the Librarian.</strong>
                </div>
            </div>
        </div>
    );
}

export default Login;