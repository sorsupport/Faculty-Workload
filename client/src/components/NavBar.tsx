import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/faculty", label: "Faculty" },
  { to: "/courses", label: "Courses" },
  { to: "/terms", label: "Terms" },
  { to: "/sections", label: "Sections" },
  { to: "/assignments", label: "Assignments" },
];

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <h1>Faculty Workload</h1>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="user-badge">
          <span className="name">{user.name}</span>
          <span className="role">{user.role}</span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </aside>
  );
}
