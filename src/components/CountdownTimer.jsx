

import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ targetDate, message }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const renderTime = (value, label) => (
    <div className="flex flex-col items-center px-2">
      <div className="text-lg font-bold text-[#F2B21C]">{value.toString().padStart(2, '0')}</div>
      <div className="text-xs text-[#F2B21C] uppercase">{label}</div>
    </div>
  );

  return (
    <div className="text-center">
      {message && <p className="text-sm text-[#F2B21C] mb-2">{message}</p>}
      <div className="flex justify-center items-center space-x-4">
        {renderTime(timeLeft.dias || 0, 'Dias')}
        {renderTime(timeLeft.horas || 0, 'Horas')}
        {renderTime(timeLeft.minutos || 0, 'Min')}
        {renderTime(timeLeft.segundos || 0, 'Seg')}
      </div>
    </div>
  );
};

export default CountdownTimer;