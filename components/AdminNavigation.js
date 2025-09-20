import Link from 'next/link';
import { useState } from 'react';

export default function AdminNavigation({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const signOut = () => {
    // Clear ALL possible authentication keys
    localStorage.removeItem('current_user');
    localStorage.removeItem('triangle_user_session');
    localStorage.removeItem('triangle-dev-mode');
    localStorage.removeItem('usmca_workflow_data');
    localStorage.removeItem('usmca_company_data');
    localStorage.removeItem('usmca_workflow_results');
    localStorage.removeItem('workflow_session_id');

    // Clear any other stored user data
    localStorage.clear();

    // Redirect to landing page
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="nav-fixed">
      <div className="nav-container">
        <Link href="/admin/dev-dashboard" className="nav-logo-link">
          <div className="nav-logo-icon">T</div>
          <div>
            <div className="nav-logo-text">Triangle Intelligence</div>
            <div className="nav-logo-subtitle">Development Operations</div>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="nav-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          ☰
        </button>

        <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link href="/admin/dev-dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Development
          </Link>
          <Link href="/admin/jorge-dashboard-clean" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Jorge
          </Link>
          <Link href="/admin/broker-dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Cristina
          </Link>
          <Link href="/admin/collaboration-workspace" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Collaboration Hub
          </Link>
          <Link href="/admin/users" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Users
          </Link>
          <button onClick={signOut} className="nav-cta-button">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}