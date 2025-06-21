
import { useAuth } from "@/contexts/AuthContext";
import { AuthenticationPage } from "@/components/auth/AuthenticationPage";
import { MainLayout } from "@/components/layout/MainLayout";
import { useUserRole } from "@/hooks/useUserRole";

const Index = () => {
  const {
    user,
    isAuthenticated,
    loading,
    manualLogin,
    manualSignUp,
    resetPassword
  } = useAuth();

  const { userRole, setUserRole, currentUser } = useUserRole(user);

  // Updated manualSignUp handler to include gender - now properly async
  const handleManualSignUp = async (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    surname: string;
    department: string;
    gender: string;
  }) => {
    await manualSignUp(userData);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthenticationPage
        manualLogin={manualLogin}
        manualSignUp={handleManualSignUp}
        resetPassword={resetPassword}
      />
    );
  }

  return (
    <MainLayout
      currentUser={currentUser}
      userRole={userRole}
      setUserRole={setUserRole}
    />
  );
};

export default Index;
