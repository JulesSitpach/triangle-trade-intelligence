import Link from 'next/link';

export default function AdminNavigation({ user }) {
  const signOut = () => {
    localStorage.removeItem('current_user');
    localStorage.removeItem('triangle_user_session');
    window.location.href = '/';
  };

  return (
    <nav className="nav-fixed">
      <div className="nav-container">
        <Link href="/admin/dashboard" className="nav-logo-link">
          <div className="nav-logo-icon">T</div>
          <div>
            <div className="nav-logo-text">Triangle Intelligence</div>
            <div className="nav-logo-subtitle">Admin Operations</div>
          </div>
        </Link>

        <div className="nav-menu">
          <Link href="/admin/dashboard" className="nav-menu-link">Dashboard</Link>
          <Link href="/admin/client-portfolio" className="nav-menu-link">Jorge</Link>
          <Link href="/admin/broker-dashboard" className="nav-menu-link">Cristina</Link>
          <Link href="/admin/collaboration-workspace" className="nav-menu-link">Collaboration Hub</Link>
          <Link href="/admin/users" className="nav-menu-link">Users</Link>
          <button onClick={signOut} className="nav-menu-link">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}