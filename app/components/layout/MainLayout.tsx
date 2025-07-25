'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { ReactNode, createContext, useContext, useState } from 'react';

// Create sidebar context
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar Provider Component
const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);
  
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Layout Component
const MainLayoutContent = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const showNavbar = pathname !== '/login';
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {showNavbar && <Navbar />}
      {/* Main Content Area - Dynamically offset based on sidebar state */}
      <main className={`transition-all duration-300 ease-in-out ${
        showNavbar ? `pt-4 ${isOpen ? 'lg:ml-64' : ''}` : ''
      }`}>
        <div className="min-h-[calc(100vh-72px)] pt-6 pl-6 pr-4 max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <MainLayoutContent>
        {children}
      </MainLayoutContent>
    </SidebarProvider>
  );
} 