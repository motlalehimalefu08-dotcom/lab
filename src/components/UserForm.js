
function UserForm({
    name,
    membershipId,
    role,
    setName,
    setMembershipId,
    setRole,
    handleSubmit
}) {
    return (
        <div className="form-panel">
            <h2>Add User</h2>

            <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                    <label htmlFor="userName">Name</label>

                    <input
                        id="userName"
                        type="text"
                        placeholder="Enter full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="membershipId">
                        Membership ID
                    </label>

                    <input
                        id="membershipId"
                        type="text"
                        placeholder="Enter Membership ID"
                        value={membershipId}
                        onChange={e =>
                            setMembershipId(e.target.value)
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="userRole">Role</label>

                    <select
                        id="userRole"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        required
                    >
                        <option value="">
                            Select Role
                        </option>

                        <option value="Librarian">
                            Librarian
                        </option>

                        <option value="User">
                            User
                        </option>
                    </select>
                </div>

                <div className="form-button">
                    <button
                        className="primary-btn"
                        type="submit"
                    >
                        Add User
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UserForm;
