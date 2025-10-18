import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import usePasswordChange from "../../context/hooks/usePasswordChange";
import { BsLock, BsEye, BsEyeSlash } from "react-icons/bs";

const PasswordManagement = () => {
  const { authUser } = useAuthContext();
  const { changePassword, getUsersForPasswordChange, loading } =
    usePasswordChange();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Check if user has permission to change passwords
  const hasPasswordChangePermission =
    authUser?.role === "super_admin" ||
    authUser?.role === "admin" ||
    authUser?.role === "manager";

  useEffect(() => {
    const fetchUsers = async () => {
      if (!hasPasswordChangePermission || !authUser) return;

      setFetchingUsers(true);
      try {
        const usersData = await getUsersForPasswordChange();
        setUsers(usersData);

        // Auto-select current user if they're in the list
        const currentUser = usersData.find((user) => user._id === authUser._id);
        if (currentUser) {
          setSelectedUser(currentUser._id);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      return alert("Please select a user");
    }

    if (!newPassword || newPassword.length < 6) {
      return alert("Password must be at least 6 characters long");
    }

    if (newPassword !== confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      await changePassword(selectedUser, newPassword);

      // Reset form
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to change password:", error);
    }
  };

  const selectedUserData = users.find((user) => user._id === selectedUser);

  if (!hasPasswordChangePermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BsLock className="text-6xl text-base-content/30 mb-4" />
        <h3 className="text-xl font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70">
          You don&apos;t have permission to change passwords.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <BsLock className="text-4xl text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-base-content">
          Password Management
        </h2>
        <p className="text-base-content/70 mt-1">
          Change passwords for authorized users
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Selection */}
        <div>
          <label htmlFor="userSelect" className="label">
            <span className="label-text font-medium">Select User</span>
          </label>
          {fetchingUsers ? (
            <div className="skeleton h-12 w-full"></div>
          ) : (
            <select
              id="userSelect"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="select select-bordered w-full"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName} ({user.role})
                  {user.shopId?.name && ` - ${user.shopId.name}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected User Info */}
        {selectedUserData && (
          <div className="alert alert-info">
            <div className="flex flex-col text-left">
              <span className="font-medium">
                Changing password for: {selectedUserData.fullName}
              </span>
              <span className="text-sm opacity-70">
                Role: {selectedUserData.role}
                {selectedUserData.shopId?.name &&
                  ` • Shop: ${selectedUserData.shopId.name}`}
              </span>
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="label">
            <span className="label-text font-medium">New Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input input-bordered w-full pr-12"
              placeholder="Enter new password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
            >
              {showPassword ? <BsEyeSlash /> : <BsEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="label">
            <span className="label-text font-medium">Confirm Password</span>
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Confirm new password"
            minLength={6}
            required
          />
        </div>

        {/* Password Match Indicator */}
        {newPassword && confirmPassword && (
          <div
            className={`text-sm ${
              newPassword === confirmPassword ? "text-success" : "text-error"
            }`}
          >
            {newPassword === confirmPassword
              ? "✓ Passwords match"
              : "✗ Passwords do not match"}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            loading ||
            !selectedUser ||
            !newPassword ||
            newPassword !== confirmPassword
          }
          className="btn btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Changing Password...
            </>
          ) : (
            <>
              <BsLock />
              Change Password
            </>
          )}
        </button>
      </form>

      {/* Role-based info */}
      <div className="mt-6 text-center">
        <div className="text-sm text-base-content/60">
          {authUser.role === "super_admin" &&
            "Super Admin: Can change all users' passwords"}
          {authUser.role === "admin" &&
            "Admin: Can change employees' and warehousemen's passwords"}
          {authUser.role === "manager" &&
            "Manager: Can only change own password"}
        </div>
      </div>
    </div>
  );
};

export default PasswordManagement;
