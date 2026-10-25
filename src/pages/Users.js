
import { useState } from "react";
import UserForm from "../components/UserForm";
import UserList from "../components/UserList";
import {
    addUser,
    updateUser as updateUserAPI,
    deleteUser as deleteUserAPI
} from "../Api";

function Users({
    users,
    setUsers,
    transactions,
    loggedInUser,
    updateLoggedInUser
}) {
    const [name, setName] = useState("");
    const [membershipId, setMembershipId] = useState("");
    const [role, setRole] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();

        if (!name.trim() || !membershipId.trim() || !role) {
            alert("Please fill in all fields.");
            return;
        }

        if (
            users.some(
                user =>
                    user.membershipId.toLowerCase() ===
                    membershipId.trim().toLowerCase()
            )
        ) {
            alert("A user with this Membership ID already exists.");
            return;
        }

        const newUser = {
            name: name.trim(),
            membershipId: membershipId.trim(),
            role
        };

        try {
            const savedUser = await addUser(newUser);

            setUsers(previousUsers => [
                ...previousUsers,
                savedUser
            ]);

            setName("");
            setMembershipId("");
            setRole("");

            alert("User added successfully.");
        } catch (error) {
            alert(error.message || "Failed to add user.");
        }
    }

    async function updateUser(id) {
        const user = users.find(item => item.id === id);

        if (!user) return;

        const newName = prompt("Enter name:", user.name);

        if (newName === null) return;

        const newMembershipId = prompt(
            "Enter Membership ID:",
            user.membershipId
        );

        if (newMembershipId === null) return;

        const newRole = prompt(
            "Enter role (Librarian or User):",
            user.role
        );

        if (newRole === null) return;

        if (
            !newName.trim() ||
            !newMembershipId.trim()
        ) {
            alert("Name and Membership ID cannot be empty.");
            return;
        }

        if (newRole !== "Librarian" && newRole !== "User") {
            alert("Role must be Librarian or User.");
            return;
        }

        if (
            users.some(
                item =>
                    String(item.id) !== String(id) &&
                    item.membershipId.toLowerCase() ===
                        newMembershipId.trim().toLowerCase()
            )
        ) {
            alert("Another user already uses this Membership ID.");
            return;
        }

        const updatedUser = {
            name: newName.trim(),
            membershipId: newMembershipId.trim(),
            role: newRole
        };

        try {
            const savedUser = await updateUserAPI(id, updatedUser);

            setUsers(previousUsers =>
                previousUsers.map(item =>
                    String(item.id) === String(id)
                        ? { ...item, ...savedUser }
                        : item
                )
            );

            if (String(user.id) === String(loggedInUser.id)) {
                updateLoggedInUser({
                    ...user,
                    ...savedUser
                });
            }

            alert("User updated successfully.");
        } catch (error) {
            alert(error.message || "Failed to update user.");
        }
    }

    async function deleteUser(id) {
        if (String(id) === String(loggedInUser.id)) {
            alert(
                "You cannot delete the currently logged-in user."
            );
            return;
        }

        const activeBorrow = transactions.some(
            transaction =>
                String(transaction.userId) === String(id) &&
                transaction.type === "borrow" &&
                transaction.status === "Borrowed"
        );

        if (activeBorrow) {
            alert(
                "This user cannot be deleted because they have a borrowed book."
            );
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user?")) {
            return;
        }

        try {
            await deleteUserAPI(id);

            setUsers(previousUsers =>
                previousUsers.filter(
                    user => String(user.id) !== String(id)
                )
            );

            alert("User deleted successfully.");
        } catch (error) {
            alert(error.message || "Failed to delete user.");
        }
    }

    return (
        <main className="main-content">
            <div className="page-title">
                <h2>User Management</h2>
                <p>Add, update and delete library users.</p>
            </div>

            <UserForm
                name={name}
                membershipId={membershipId}
                role={role}
                setName={setName}
                setMembershipId={setMembershipId}
                setRole={setRole}
                handleSubmit={handleSubmit}
            />

            <UserList
                users={users}
                updateUser={updateUser}
                deleteUser={deleteUser}
            />
        </main>
    );
}

export default Users;
