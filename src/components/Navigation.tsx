import { Link, useLocation } from 'react-router-dom';
import { Receipt, Users, LogOut, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const Navigation = () => {
  const location = useLocation();
  const { logout, profile, userRole } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">Bill Tracker</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Bills
                </Link>
              </Button>
              
              <Button
                variant={isActive('/doordash') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/doordash" className="gap-2">
                  <Truck className="h-4 w-4" />
                  DoorDash
                </Link>
              </Button>
              
              {userRole === 'admin' && (
                <Button
                  variant={isActive('/users') ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/users" className="gap-2">
                    <Users className="h-4 w-4" />
                    Users
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, {profile?.first_name || 'User'}
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};