
import { useState, useEffect } from "react";
import { AccountInfo } from '@azure/msal-browser';

export const useUserRole = (user: AccountInfo | null) => {
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin' | 'country_director'>('employee');

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
    role: user?.idTokenClaims?.role || userRole // Use role from token claims if available
  };

  // Set role based on user's token claims (database-driven)
  useEffect(() => {
    if (user) {
      console.log('[useUserRole] User changed, determining role for:', user.username);
      
      // Get role from token claims (this comes from the database via JWT)
      let actualRole: 'employee' | 'manager' | 'admin' | 'country_director' = 'employee';
      
      if (user.idTokenClaims?.role) {
        console.log('[useUserRole] User role from token claims:', user.idTokenClaims.role);
        actualRole = user.idTokenClaims.role as 'employee' | 'manager' | 'admin' | 'country_director';
      } else {
        console.log('[useUserRole] No role in token claims, defaulting to employee');
      }
      
      console.log('[useUserRole] Setting user role to:', actualRole);
      setUserRole(actualRole);
      
      // Log token info for debugging
      const authToken = localStorage.getItem('auth_token');
      console.log('[useUserRole] Auth token present:', !!authToken);
    }
  }, [user]);

  return { userRole, setUserRole, currentUser };
};
