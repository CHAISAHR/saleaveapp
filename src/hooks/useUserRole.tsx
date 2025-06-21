
import { useState, useEffect } from "react";
import { AccountInfo } from '@azure/msal-browser';

export const useUserRole = (user: AccountInfo | null) => {
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin'>('employee');

  // Determine user role based on email or stored data
  const determineUserRole = (userEmail: string): 'employee' | 'manager' | 'admin' => {
    console.log('[useUserRole] Determining user role for:', userEmail);
    
    // Admin users (you can modify this logic as needed)
    const adminEmails = ['admin@company.com', 'hr@company.com'];
    
    // Manager users (you can modify this logic as needed)
    const managerEmails = ['sarah.johnson@company.com', 'manager@company.com'];
    
    let role: 'employee' | 'manager' | 'admin' = 'employee';
    
    if (adminEmails.includes(userEmail)) {
      role = 'admin';
    } else if (managerEmails.includes(userEmail)) {
      role = 'manager';
    }
    
    console.log('[useUserRole] Determined role:', role, 'for user:', userEmail);
    return role;
  };

  // Get user's full name from different sources
  const getUserFullName = () => {
    if (!user) return "Unknown User";
    
    // Try to get from idTokenClaims first (for detailed info)
    if (user.idTokenClaims?.given_name && user.idTokenClaims?.family_name) {
      return `${user.idTokenClaims.given_name} ${user.idTokenClaims.family_name}`;
    }
    
    // Fall back to user.name if available
    if (user.name && user.name.includes(' ')) {
      return user.name;
    }
    
    // Last resort: use email prefix
    return user.username?.split('@')[0] || "User";
  };

  // Sample user data with role - in real app this would come from your backend
  const currentUser = {
    name: getUserFullName(),
    email: user?.username || "sarah.johnson@company.com",
    department: user?.idTokenClaims?.department || "HR",
    avatar: "",
    employeeId: "EMP001",
    role: determineUserRole(user?.username || "sarah.johnson@company.com")
  };

  // Set initial role based on user's actual role
  useEffect(() => {
    if (user) {
      console.log('[useUserRole] User changed, determining role for:', user.username);
      const actualRole = determineUserRole(user.username);
      console.log('[useUserRole] Setting user role to:', actualRole);
      setUserRole(actualRole);
      
      // Log token info for debugging
      const authToken = localStorage.getItem('auth_token');
      console.log('[useUserRole] Auth token present:', !!authToken);
      if (user.idTokenClaims?.role) {
        console.log('[useUserRole] User role from token claims:', user.idTokenClaims.role);
      }
    }
  }, [user]);

  return { userRole, setUserRole, currentUser };
};
