import { useEffect, useState } from 'react';

const LoadingState = ({ message = 'Loading...', showSpinner = true }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="card-body">
        {showSpinner && (
          <div className="text-center">
            <div className="text-body">⟳</div>
          </div>
        )}
        <div className="text-center text-body">
          {message}{dots}
        </div>
      </div>
    </div>
  );
};

export default LoadingState;