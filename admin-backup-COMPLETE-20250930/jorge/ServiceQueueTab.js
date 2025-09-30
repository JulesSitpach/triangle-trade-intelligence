import { useState, useEffect } from 'react';

export default function ServiceQueueTab() {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueueData();
  }, []);

  const loadQueueData = async () => {
    const mockQueue = [
      {
        id: 1,
        client: 'TechCorp Industries',
        service: 'Supplier Sourcing',
        priority: 'high',
        deadline: '2025-01-15',
        status: 'pending',
        value: '$500'
      },
      {
        id: 2,
        client: 'Manufacturing Solutions LLC',
        service: 'Manufacturing Feasibility',
        priority: 'medium',
        deadline: '2025-01-20',
        status: 'in_progress',
        value: '$650'
      }
    ];

    setQueueItems(mockQueue);
    setLoading(false);
  };

  if (loading) {
    return <div className="tab-content">Loading...</div>;
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">📋 Service Queue</h2>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Service</th>
            <th>Status</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {queueItems.map(item => (
            <tr key={item.id}>
              <td>{item.client}</td>
              <td>{item.service}</td>
              <td>
                <span className={`status-badge status-${item.status}`}>
                  {item.status}
                </span>
              </td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}