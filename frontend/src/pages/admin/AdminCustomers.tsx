import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminDashboard.css";
import { API_ENDPOINTS } from "../../config";
import Pagination, { PaginationInfo } from "../../components/Pagination";
import { logger } from "../../utils/logger";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const res = await fetch(
        `${API_ENDPOINTS.ADMIN_CUSTOMERS}?page=${currentPage}&per_page=25${searchParam}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Failed to fetch customers (${res.status})`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      logger.error("Failed to fetch customers:", err);
      setError(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && customers.length === 0) return <div className="admin-dashboard"><p>Loading...</p></div>;
  if (error) return <div className="admin-dashboard"><p className="error-text">{error}</p></div>;

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Customers</h1>
        <p>View and manage customer records</p>
      </header>

      <div className="dashboard-card">
        <form onSubmit={handleSearch} className="search-bar" style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="action-btn">Search</button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Since</th>
              <th style={{ width: "10%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/customers/${c.id}`)}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/admin/customers/${c.id}`); }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}
    </div>
  );
}
