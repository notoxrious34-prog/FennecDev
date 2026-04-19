import React, { useState } from 'react';
import logoImg from '/logo-fennec.png';

const Logo = () => {
  const [error, setError] = useState(false);

  return (
    <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shrink-0 ring-2 ring-slate-100 dark:ring-white/10 bg-transparent flex items-center justify-center bg-white">
    {!error ? (
      <img 
        src={logoImg} 
        alt="Fennec Logo" 
        className="w-full h-full object-cover scale-[1.12] mix-blend-multiply dark:mix-blend-normal"
        onError={(e) => (e.currentTarget.src = './logo-fennec.png')} 
      />
    ) : (
      <>
        <div className="text-xs text-center text-slate-400 font-bold">Fennec</div>
        <span>Logo Error</span>
      </>
    )}
    </div>
  );
};

export default Logo;