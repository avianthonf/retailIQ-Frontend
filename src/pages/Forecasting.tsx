/**
 * src/pages/Forecasting.tsx
 * Forecasting Redirect Page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForecastingRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show toast message before redirecting
    alert('Demand forecasting has been consolidated into the Market Intelligence module. Redirecting...');
    navigate('/market-intelligence');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to Market Intelligence module...</p>
      </div>
    </div>
  );
}
