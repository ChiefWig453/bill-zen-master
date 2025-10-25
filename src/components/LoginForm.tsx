import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { loginSchema } from '@/lib/validation';

export const LoginForm = () => {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with Zod
    const validationResult = loginSchema.safeParse({
      email: email.trim(),
      password
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const { success, error } = await login(email, password);
    
    if (success) {
      toast({
        title: "Welcome!",
        description: "You have successfully logged in."
      });
    } else {
      toast({
        title: "Login failed",
        description: error || "Invalid credentials. Please check your email and password.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <p className="text-muted-foreground">
            Access your bill tracker account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="p-0 h-auto text-primary text-sm"
              onClick={() => setShowResetDialog(true)}
            >
              Forgot your password?
            </Button>
          </div>
        </CardContent>
        
        <ResetPasswordDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
        />
      </Card>
    </div>
  );
};