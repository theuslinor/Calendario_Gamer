import { useState, useEffect } from 'react';

export function useCountdown(targetDate) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = null;

    if (difference > 0) {
      timeLeft = {
        anos: Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25)),
        dias: Math.floor((difference / (1000 * 60 * 60 * 24)) % 365.25),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
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

  return timeLeft;
}