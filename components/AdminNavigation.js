import Link from 'next/link';
import { useState } from 'react';
import { useSimpleAuth } from '../lib/contexts/SimpleAuthContext';

export default function AdminNavigation({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useSimpleAuth();

  const signOut = async () => {
    // Clear workflow data (keep this for workflow cleanup)
    localStorage.removeItem('usmca_workflow_data');
    localStorage.removeItem('usmca_company_data');
    localStorage.removeItem('usmca_workflow_results');
    localStorage.removeItem('workflow_session_id');
    localStorage.removeItem('triangle-dev-mode');

    // Call the proper logout that clears cookie
    await logout();
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
          <Link href="/admin/jorge-dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Jorge
          </Link>
          <Link href="/admin/broker-dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            Cristina
          </Link>
          <Link href="/admin/agent-performance" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            🤖 Agent Performance
          </Link>
          <Link href="/admin/research-automation-dashboard" className="nav-menu-link" onClick={() => setMobileMenuOpen(false)}>
            🔬 Research Automation
          </Link>
          <button onClick={signOut} className="nav-cta-button">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}