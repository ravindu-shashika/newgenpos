import React from "react";
import { Link } from "react-router-dom";

export default function TopHead({ user }) {
  return (
    <header
      style={{
        height: 60,
        background: "#fff",
        borderBottom: "1px solid #eceef3",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 700 }}>SalePro POS</span>
        <Link to="/dashboard" style={{ color: "#733686", textDecoration: "none", fontSize: 13 }}>
          Dashboard
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
        <span>{user?.name}</span>
        <Link to="/user-profile" style={{ color: "#733686", textDecoration: "none" }}>
          Profile
        </Link>
        <a href="/logout" style={{ color: "#e74c3c", textDecoration: "none" }}>
          Logout
        </a>
      </div>
    </header>
  );
}
