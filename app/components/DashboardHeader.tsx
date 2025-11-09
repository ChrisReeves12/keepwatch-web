import { Form, Link } from "react-router";
import { User, Settings, LogOut, ChevronDown, CreditCard } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark">KeepWatch</h1>
            <p className="text-sm text-neutral mt-1">Application Monitoring Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

// User Menu Dropdown Component
function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <div className="h-8 w-8 bg-brand rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <ChevronDown className={`h-4 w-4 text-neutral transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-primary-dark">My Account</p>
          </div>

          <div className="py-1">
            <Link
              to="/account/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-neutral" />
              Account Settings
            </Link>

            <Link
              to="/account/billing"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="h-4 w-4 text-neutral" />
              Billing Settings
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-1">
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}

