/**
 * src/pages/Credit.tsx
 * Credit Redirect Page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreditRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show toast message before redirecting
    alert('Credit management has been consolidated into the Finance module. Redirecting...');
    navigate('/finance');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecting to Finance module...</p>
      </div>
    </div>
  );
}
