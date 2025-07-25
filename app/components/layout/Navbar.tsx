'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { navigationService, NavigationItem } from '@/services/navigationService';
import { useSidebar } from './MainLayout';

const Navbar = () => {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [isLoadingNav, setIsLoadingNav] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loginTime, setLoginTime] = useState('');
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();

  useEffect(() => {
    const storedLoginTime = Cookies.get('loginTime');
    if (user && storedLoginTime) {
      const time = new Date(storedLoginTime).toLocaleString();
      setLoginTime(time);
    }
  }, [user]);

  // Fetch navigation items when user is available
  useEffect(() => {
    const fetchNavigation = async () => {
      if (user) {
        try {
          setIsLoadingNav(true);
          const navResponse = await navigationService.getNavigation();
          // Ensure we always have an array
          setNavigationItems(navResponse?.navigation || []);
        } catch (error) {
          console.error('Failed to fetch navigation:', error);
          // Fallback to default navigation
          setNavigationItems([
            { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' }
          ]);
        } finally {
          setIsLoadingNav(false);
        }
      } else {
        // If no user, reset navigation items and stop loading
        setNavigationItems([]);
        setIsLoadingNav(false);
      }
    };

    fetchNavigation();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return '?';
  };

  const isActiveRoute = (path: string) => {
    return pathname === path;
  };

  const getIconForNavItem = (iconName: string) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        );
      case 'branches':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'employees':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'tests':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'doctors':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'reporting':
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-blue-700 dark:bg-blue-800 text-white p-4 flex justify-between items-center shadow-lg relative z-30">
      <div className="flex items-center">
        <button 
            onClick={toggleSidebar}
            className="mr-4 focus:outline-none hover:bg-blue-600 dark:hover:bg-blue-700 p-1 rounded transition-colors duration-200"
          aria-label="Toggle navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
          <h1 className="text-xl font-bold">PMS</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg p-3 shadow-lg border-0 dark:border dark:border-gray-700 flex flex-row items-center min-w-[320px] gap-4">
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
              {getUserInitial()}
            </div>
              <div className="flex flex-col justify-center mr-4">
                <div className="font-semibold leading-tight">{user.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                  Logged in: {loginTime}
                </div>
                </div>
                <button 
                  onClick={handleLogout}
                className="ml-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none transition-colors duration-200"
                >
                  Logout
                </button>
          </div>
        )}
      </div>
      </nav>

      {/* Unified Sidebar - Works on all screen sizes */}
      <div className={`fixed left-0 top-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transition-transform duration-300 ease-in-out flex flex-col h-screen ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Spacer for navbar height */}
        <div className="h-[72px] bg-blue-700 dark:bg-blue-800"></div>
        
        {/* Blue Header Section */}
        <div className="bg-blue-700 dark:bg-blue-800 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
              <button 
              onClick={closeSidebar}
              className="text-blue-100 hover:text-white dark:text-blue-200 dark:hover:text-white transition-colors duration-200"
              aria-label="Close navigation"
              >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
            </div>
            
        {/* White Content Section */}
        <div className="p-4 flex-1 overflow-y-auto">
                {isLoadingNav ? (
            <div className="text-gray-500 dark:text-gray-400">Loading navigation...</div>
          ) : (
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                        <Link 
                  key={item.path}
                          href={item.path} 
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isActiveRoute(item.path)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    // Close sidebar on mobile when navigation item is clicked
                    if (window.innerWidth < 1024) {
                      closeSidebar();
                    }
                  }}
                        >
                          {getIconForNavItem(item.icon)}
                          {item.name}
                        </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar; 