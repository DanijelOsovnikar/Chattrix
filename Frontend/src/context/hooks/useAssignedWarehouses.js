import { useState, useEffect } from "react";

const useAssignedWarehouses = () => {
  const [assignedWarehouses, setAssignedWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignedWarehouses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/warehouses/my-shop/assigned", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedWarehouses(data);
      } else {
        setAssignedWarehouses([]);
      }
    } catch (error) {
      console.error("Error fetching assigned warehouses:", error);
      setAssignedWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedWarehouses();
  }, []);

  return { assignedWarehouses, loading, refetch: fetchAssignedWarehouses };
};

export default useAssignedWarehouses;
