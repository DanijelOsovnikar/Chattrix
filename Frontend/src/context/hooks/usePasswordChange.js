import { useState, useCallback } from "react";
import toast from "react-hot-toast";

const usePasswordChange = () => {
  const [loading, setLoading] = useState(false);

  const changePassword = async (userId, newPassword) => {
    setLoading(true);
    try {
      const res = await fetch("/api/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, newPassword }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Password changed successfully for ${data.changedFor}`);
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUsersForPasswordChange = useCallback(async () => {
    try {
      const res = await fetch("/api/password/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (res.status >= 400) {
        throw new Error(data.error || "Failed to fetch users");
      }

      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  }, []);

  return { changePassword, getUsersForPasswordChange, loading };
};

export default usePasswordChange;
