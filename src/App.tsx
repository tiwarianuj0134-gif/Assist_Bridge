import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { EmailVerification } from "./pages/EmailVerification";
import { UserDetailsForm, type UserDetails } from "./pages/UserDetailsForm";
import { Dashboard } from "./pages/Dashboard";
import { InvestorDashboard } from "./pages/InvestorDashboard";
import { CreditPassport } from "./pages/CreditPassport";
import { AssetLocking } from "./pages/AssetLocking";
import { Marketplace } from "./pages/Marketplace";
import { AIChatbot } from "./pages/AIChatbot";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminLogin } from "./pages/AdminLogin";
import { FXHedging } from "./pages/FXHedging";
import { ReverseRemittance } from "./pages/ReverseRemittance";
import { GlobalCard } from "./pages/GlobalCard";
import { ForgotPassword } from "./pages/ForgotPassword";
import { NotificationPanel } from "./components/NotificationPanel";
import { VoiceAgent } from "./components/VoiceAgent";
import { authApi, userApi, assetsApi } from "./services/api";

export type Page = "landing" | "login" | "register" | "verify" | "details" | "dashboard" | "investor-dashboard" | "credit" | "assets" | "marketplace" | "chatbot" | "admin" | "admin-login" | "fx" | "remittance" | "card" | "forgot-password";

interface UserState {
  isAuthenticated: boolean;
  isVerified: boolean;
  hasCompletedDetails: boolean;
  isAdmin: boolean;
  isInvestor: boolean;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  userDetails?: UserDetails;
}

export function App() {
  const [page, setPage] = useState<Page>("landing");
  const [showNotifications, setShowNotifications] = useState(false);
  const [userState, setUserState] = useState<UserState>(() => {
    // Check localStorage for existing user session
    const saved = localStorage.getItem("assetbridge_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    return {
      isAuthenticated: false,
      isVerified: false,
      hasCompletedDetails: false,
      isAdmin: false,
      isInvestor: false,
      email: "",
    };
  });

  // Save user state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("assetbridge_user", JSON.stringify(userState));
  }, [userState]);

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking authentication status...');
      
      // Check URL for /admin route
      const currentPath = window.location.pathname;
      if (currentPath === '/admin') {
        console.log('🔐 Admin route detected');
        const saved = localStorage.getItem("assetbridge_user");
        
        if (saved) {
          const parsed = JSON.parse(saved);
          // Check if user is admin with correct email
          if (parsed.isAdmin && parsed.email === "assistbridge15@gmail.com") {
            console.log('✅ Admin session found, redirecting to admin panel');
            setUserState(parsed);
            setPage("admin");
            return;
          }
        }
        
        // Not admin or not logged in, show admin panel login directly
        console.log('⚠️ No admin session, showing admin panel');
        setPage("admin");
        return;
      }
      
      const saved = localStorage.getItem("assetbridge_user");
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Found saved user state:', parsed);
          
          if (parsed.isAuthenticated && parsed.accessToken) {
            // Verify token and get profile
            console.log('📡 Fetching user profile...');
            const profileResponse = await userApi.getProfile();
            
            if (profileResponse.status === 'success' && profileResponse.data) {
              const profile = profileResponse.data as any;
              console.log('✅ Profile loaded:', profile);
              
              // Check if profile is completed
              const isProfileComplete = profile.profile_completed === true;
              const isInvestor = profile.account_type === 'INVESTOR';
              console.log('Profile completed:', isProfileComplete);
              console.log('Is Investor:', isInvestor);
              
              if (isProfileComplete) {
                // User has completed profile - go to appropriate dashboard
                console.log('✅ Redirecting to Dashboard');
                setUserState(prev => ({ 
                  ...prev, 
                  hasCompletedDetails: true,
                  isInvestor 
                }));
                setPage(isInvestor ? "investor-dashboard" : "dashboard");
              } else {
                // User needs to complete details
                console.log('⚠️ Profile incomplete - redirecting to details form');
                setPage("details");
              }
            } else {
              console.log('❌ Failed to load profile, redirecting to login');
              setPage("login");
            }
          }
        } catch (error) {
          console.error('❌ Auth check error:', error);
          setPage("landing");
        }
      } else {
        console.log('No saved user state found');
      }
    };
    
    checkAuth();
  }, []);

  // Handle admin login
  const handleAdminLogin = async (email: string, password: string) => {
    try {
      // CRITICAL: Hardcoded admin check
      if (email !== "assistbridge15@gmail.com" || password !== "Anuj@1234") {
        alert('Access Denied: Invalid admin credentials');
        return;
      }

      console.log('🔐 Admin login attempt for:', email);
      const response = await authApi.login({ email, password });
      
      if (response.status === 'success' && response.data) {
        const { accessToken, refreshToken, user } = response.data as any;
        console.log('✅ Admin login successful');
        
        // Save admin session
        const adminState = {
          isAuthenticated: true,
          isVerified: true,
          hasCompletedDetails: true,
          isAdmin: true,
          isInvestor: false,
          email: user.email,
          accessToken,
          refreshToken,
        };
        
        localStorage.setItem("assetbridge_user", JSON.stringify(adminState));
        setUserState(adminState);
        setPage("admin");
      } else {
        alert(response.error?.message || 'Admin login failed');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      alert('Failed to connect to server');
    }
  };

  // Handle navigation with authentication checks
  const handleNavigate = (newPage: Page) => {
    // Admin panel access check
    if (newPage === "admin") {
      if (!userState.isAdmin) {
        // Redirect to admin login
        setPage("admin-login");
        return;
      }
    }
    
    // CRITICAL: Redirect investors to investor dashboard if they try to access regular dashboard
    if (newPage === "dashboard" && userState.isInvestor) {
      setPage("investor-dashboard");
      return;
    }
    
    // CRITICAL: Redirect borrowers to regular dashboard if they try to access investor dashboard
    if (newPage === "investor-dashboard" && !userState.isInvestor) {
      setPage("dashboard");
      return;
    }
    
    // If trying to access protected pages without auth, redirect to login
    const protectedPages: Page[] = ["dashboard", "investor-dashboard", "credit", "assets", "marketplace", "chatbot", "admin", "fx", "remittance", "card"];
    
    if (protectedPages.includes(newPage) && !userState.hasCompletedDetails) {
      setPage("login");
      return;
    }
    
    setPage(newPage);
  };

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await authApi.login({ email, password });
      
      if (response.status === 'success' && response.data) {
        const { accessToken, refreshToken, user } = response.data as any;
        console.log('✅ Login successful, tokens received');
        
        // Save tokens to localStorage immediately
        const userStateData = {
          isAuthenticated: true,
          isVerified: true,
          hasCompletedDetails: false,
          isAdmin: false,
          isInvestor: false,
          email: user.email,
          accessToken,
          refreshToken,
        };
        
        localStorage.setItem("assetbridge_user", JSON.stringify(userStateData));
        setUserState(userStateData);
        
        // Check if user has completed details
        console.log('📡 Fetching user profile...');
        const profileResponse = await userApi.getProfile();
        
        if (profileResponse.status === 'success' && profileResponse.data) {
          const profile = profileResponse.data as any;
          console.log('✅ Profile loaded:', profile);
          
          // CRITICAL: Check profile_completed flag
          const isProfileComplete = profile.profile_completed === true;
          const isInvestor = profile.account_type === 'INVESTOR';
          console.log('Profile completed flag:', isProfileComplete);
          console.log('Is Investor:', isInvestor);
          
          if (isProfileComplete) {
            // User has completed profile - go to appropriate dashboard
            console.log('✅ Profile complete - redirecting to Dashboard');
            const completeState = { ...userStateData, hasCompletedDetails: true, isInvestor };
            localStorage.setItem("assetbridge_user", JSON.stringify(completeState));
            setUserState(completeState);
            setPage(isInvestor ? "investor-dashboard" : "dashboard");
          } else {
            // User needs to complete details
            console.log('⚠️ Profile incomplete - redirecting to details form');
            setPage("details");
          }
        } else {
          console.log('❌ Failed to load profile - redirecting to details form');
          setPage("details");
        }
      } else {
        alert(response.error?.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Failed to connect to server. Please check if backend is running.');
    }
  };

  // Handle registration
  const handleRegister = async (email: string, password: string, firstName: string, lastName: string, phone: string, accountType: 'BORROWER' | 'INVESTOR') => {
    const response = await authApi.register({ email, password, firstName, lastName, phone, accountType });
    
    if (response.status === 'success' && response.data) {
      const { accessToken, refreshToken } = response.data as any;
      
      setUserState({
        isAuthenticated: true,
        isVerified: false,
        hasCompletedDetails: false,
        isAdmin: false,
        isInvestor: accountType === 'INVESTOR',
        email,
        accessToken,
        refreshToken,
      });
      setPage("verify");
    } else {
      alert(response.error?.message || 'Registration failed');
    }
  };

  // Handle email verification
  const handleEmailVerified = async () => {
    await authApi.verifyEmail({ email: userState.email, code: '123456' });
    setUserState({
      ...userState,
      isVerified: true,
    });
    setPage("details");
  };

  // Update user details
  const handleDetailsComplete = async (details: UserDetails) => {
    const response = await userApi.updateDetails(details);
    
    if (response.status === 'success') {
      // Add sample assets for demo
      await assetsApi.addAsset({
        assetType: 'FD',
        name: 'HDFC Fixed Deposit',
        currentValue: 500000,
        currency: 'INR'
      });
      
      await assetsApi.addAsset({
        assetType: 'STOCK',
        name: 'Stock Portfolio',
        currentValue: 1200000,
        currency: 'INR'
      });
      
      setUserState({
        ...userState,
        hasCompletedDetails: true,
        userDetails: details,
      });
      setPage("dashboard");
    } else {
      alert(response.error?.message || 'Failed to update details');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("assetbridge_user");
    setUserState({
      isAuthenticated: false,
      isVerified: false,
      hasCompletedDetails: false,
      isAdmin: false,
      isInvestor: false,
      email: "",
    });
    setPage("landing");
  };

  const renderPage = () => {
    switch (page) {
      case "landing": 
        return <Landing onNavigate={handleNavigate} />;
      case "login": 
        return <Login onLogin={handleLogin} onSwitchToRegister={() => setPage("register")} onForgotPassword={() => setPage("forgot-password")} />;
      case "register": 
        return <Register onRegister={handleRegister} onSwitchToLogin={() => setPage("login")} />;
      case "verify": 
        return <EmailVerification email={userState.email} onVerified={handleEmailVerified} />;
      case "details": 
        return <UserDetailsForm onComplete={handleDetailsComplete} />;
      case "forgot-password":
        return <ForgotPassword onBack={() => setPage("login")} onResetComplete={() => setPage("login")} />;
      case "admin-login":
        return <AdminLogin onAdminLogin={handleAdminLogin} onBack={() => setPage("login")} />;
      case "dashboard": 
        return <Dashboard onNavigate={handleNavigate} />;
      case "investor-dashboard": 
        return <InvestorDashboard onNavigate={handleNavigate} />;
      case "credit": 
        return <CreditPassport onNavigate={handleNavigate} />;
      case "assets": 
        return <AssetLocking onNavigate={handleNavigate} />;
      case "marketplace": 
        return <Marketplace onNavigate={handleNavigate} />;
      case "chatbot": 
        return <AIChatbot onNavigate={handleNavigate} />;
      case "admin": 
        return <AdminPanel onNavigate={handleNavigate} />;
      case "fx": 
        return <FXHedging onNavigate={handleNavigate} />;
      case "remittance": 
        return <ReverseRemittance onNavigate={handleNavigate} />;
      case "card": 
        return <GlobalCard onNavigate={handleNavigate} />;
      default: 
        return <Landing onNavigate={handleNavigate} />;
    }
  };

  const showNavbar = !["landing", "login", "register", "verify", "details", "forgot-password", "admin-login"].includes(page);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      {showNavbar && (
        <Navbar
          currentPage={page}
          onNavigate={handleNavigate}
          onNotificationClick={() => setShowNotifications(!showNotifications)}
          onLogout={handleLogout}
          isInvestor={userState.isInvestor}
        />
      )}
      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
      {showNavbar && (
        <>
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
          <VoiceAgent onNavigate={handleNavigate} />
        </>
      )}
    </div>
  );
}
