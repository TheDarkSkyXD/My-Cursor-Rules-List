"use client";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-4">Você está offline</h1>
      <p className="mb-2">Não foi possível conectar ao MealTime.</p>
<p className="mb-4">Verifique sua conexão com a internet e tente novamente.</p>
  <span role="img" aria-label="Gato triste" className="text-5xl">😿</span>
 <button 
   onClick={() => window.location.reload()} 
   className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
 >
   Tentar novamente
 </button>
    </div>
  );
} 