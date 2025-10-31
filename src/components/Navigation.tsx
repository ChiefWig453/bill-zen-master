import { Link, useLocation } from 'react-router-dom';
import { Receipt, Users, LogOut, Truck, Settings, Wrench, Menu, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export const Navigation = () => {
  const location = useLocation();
  const { logout, profile, userRole, userPreferences } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = (
    <>
      {(userPreferences?.bills_enabled ?? true) && (
        <Button
          variant={isActive('/') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          onClick={() => setMobileMenuOpen(false)}
        >
          <Link to="/" className="gap-2 w-full justify-start">
            <Receipt className="h-4 w-4" />
            Bills
          </Link>
        </Button>
      )}
      
      {(userPreferences?.doordash_enabled ?? false) && (
        <Button
          variant={isActive('/doordash') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          onClick={() => setMobileMenuOpen(false)}
        >
          <Link to="/doordash" className="gap-2 w-full justify-start">
            <Truck className="h-4 w-4" />
            DoorDash
          </Link>
        </Button>
      )}
      
      {(userPreferences?.home_maintenance_enabled ?? false) && (
        <Button
          variant={isActive('/maintenance') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          onClick={() => setMobileMenuOpen(false)}
        >
          <Link to="/maintenance" className="gap-2 w-full justify-start">
            <Wrench className="h-4 w-4" />
            Maintenance
          </Link>
        </Button>
      )}
      
      {userRole === 'admin' && (
        <Button
          variant={isActive('/users') ? 'secondary' : 'ghost'}
          size="sm"
          asChild
          onClick={() => setMobileMenuOpen(false)}
        >
          <Link to="/users" className="gap-2 w-full justify-start">
            <Users className="h-4 w-4" />
            Users
          </Link>
        </Button>
      )}

      <Button
        variant={isActive('/settings') ? 'secondary' : 'ghost'}
        size="sm"
        asChild
        onClick={() => setMobileMenuOpen(false)}
      >
        <Link to="/settings" className="gap-2 w-full justify-start">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </Button>
    </>
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks}
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, {profile?.first_name || 'User'}
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-4 mt-6">
                <div className="pb-4 border-b">
                  <p className="text-sm text-muted-foreground">Welcome,</p>
                  <p className="font-medium">{profile?.first_name || 'User'}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  {navLinks}
                </div>
                
                <div className="pt-4 border-t mt-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="gap-2 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};