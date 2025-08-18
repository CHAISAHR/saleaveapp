
import { useState, useEffect } from "react";
import { AccountInfo } from '@azure/msal-browser';
import { normalizeRole } from '@/lib/utils';

export const useUserRole = (user: AccountInfo | null) => {
  const [userRole, setUserRole] = useState<'employee' | 'manager' | 'admin' | 'cd'>(() => {
    // Try to get persisted role from localStorage first
    const persistedRole = localStorage.getItem('selectedRole');
    return persistedRole as 'employee' | 'manager' | 'admin' | 'cd' || 'employee';
  });

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
      console.log('[useUserRole] Full user object:', user);
      console.log('[useUserRole] User idTokenClaims:', user.idTokenClaims);
      
      // Get role from token claims (this comes from the database via JWT)
      let actualRole: 'employee' | 'manager' | 'admin' | 'cd' = 'employee';
      
      if (user.idTokenClaims?.role) {
        console.log('[useUserRole] User role from token claims:', user.idTokenClaims.role);
        // Normalize cd role handling
        const roleFromToken = user.idTokenClaims.role.toString();
        if (roleFromToken.toLowerCase() === 'cd') {
          actualRole = 'cd';
        } else {
          actualRole = roleFromToken as 'employee' | 'manager' | 'admin' | 'cd';
        }
      } else {
        console.log('[useUserRole] No role in token claims, defaulting to employee');
      }
      
      console.log('[useUserRole] Setting user role to:', actualRole);
      
      // Check if there's a persisted role that's valid for this user
      const persistedRole = localStorage.getItem('selectedRole') as 'employee' | 'manager' | 'admin' | 'cd' | null;
      
      // Only use persisted role if user has permission for it
      if (persistedRole && canSwitchToRole(actualRole, persistedRole)) {
        console.log('[useUserRole] Using persisted role:', persistedRole);
        setUserRole(persistedRole);
      } else {
        console.log('[useUserRole] Using actual role:', actualRole);
        setUserRole(actualRole);
        localStorage.removeItem('selectedRole'); // Clear invalid persisted role
      }
      
      // Log token info for debugging
      const authToken = localStorage.getItem('auth_token');
      console.log('[useUserRole] Auth token present:', !!authToken);
      
      // Force a re-render when role changes to cd
      if (normalizeRole(actualRole) === 'cd') {
        console.log('[useUserRole] cd role detected, forcing state update');
      }
    }
  }, [user]);

  // Helper function to determine if user can switch to a role
  const canSwitchToRole = (actualRole: string, targetRole: string): boolean => {
    if (normalizeRole(actualRole) === 'admin') return true; // Admin can switch to any role
    if (normalizeRole(actualRole) === 'cd') return ['employee', 'manager', 'cd'].includes(normalizeRole(targetRole));
    if (normalizeRole(actualRole) === 'manager') return ['employee', 'manager'].includes(normalizeRole(targetRole));
    return normalizeRole(targetRole) === 'employee'; // Employees can only be employees
  };

  // Enhanced setUserRole that persists to localStorage
  const setUserRoleWithPersistence = (role: 'employee' | 'manager' | 'admin' | 'cd') => {
    console.log('[useUserRole] Setting role with persistence:', role);
    localStorage.setItem('selectedRole', role);
    setUserRole(role);
  };

  return { userRole, setUserRole: setUserRoleWithPersistence, currentUser };
};
