import { useState, useEffect } from 'react';
import { balanceService, EmployeeBalance } from '@/services/balanceService';

export const useEmployeeBalance = (employeeEmail: string, leaveType: string) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeEmail || !leaveType) return;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const employeeBalance = await balanceService.getEmployeeBalance(employeeEmail);
        if (employeeBalance) {
          const currentBalance = balanceService.calculateCurrentBalance(
            employeeBalance, 
            leaveType.toLowerCase(), 
            employeeBalance.Start_date
          );
          setBalance(currentBalance);
        } else {
          setError('Balance not found');
        }
      } catch (err) {
        console.error('Error fetching employee balance:', err);
        setError('Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [employeeEmail, leaveType]);

  return { balance, loading, error };
};