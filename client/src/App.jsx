import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Menghubungkan ke server...');

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch('http://localhost:5000/api/health');

        if (!response.ok) {
          throw new Error('Gagal mengambil data dari server');
        }

        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error('Error:', error);
        setMessage('Backend tidak dapat dihubungi.');
      }
    }

    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card bg-base-200 shadow-xl p-8">
        <h1 className="text-2xl font-bold">WebLab</h1>
        <p className="mt-3">{message}</p>
      </div>
    </div>
  );
}

export default App;