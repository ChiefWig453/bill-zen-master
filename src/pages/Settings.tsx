import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { personalInfoSchema, passwordUpdateSchema } from '@/lib/validation';
import type { PersonalInfoFormData, PasswordUpdateFormData } from '@/types/settings';
import { Navigation } from '@/components/Navigation';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const { user, profile, userPreferences, updateUserPreferences, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isUpdatingPersonalInfo, setIsUpdatingPersonalInfo] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const personalInfoForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
    },
  });

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      personalInfoForm.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
      });
    }
  }, [profile, personalInfoForm]);

  const passwordForm = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onPersonalInfoSubmit = async (data: PersonalInfoFormData) => {
    if (!user) return;

    setIsUpdatingPersonalInfo(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refetch the profile to update the auth context
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedProfile) {
        personalInfoForm.reset({
          first_name: updatedProfile.first_name || '',
          last_name: updatedProfile.last_name || '',
        });
      }

      await refreshProfile();

      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPersonalInfo(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordUpdateFormData) => {
    if (!user?.email) return;

    setIsUpdatingPassword(true);
    try {
      const result = await apiClient.updatePassword(data.current_password, data.new_password);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setIsUpdatingPassword(false);
        return;
      }

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      passwordForm.reset();
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Personal Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name and profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  {...personalInfoForm.register('first_name')}
                  placeholder="Enter your first name"
                />
                {personalInfoForm.formState.errors.first_name && (
                  <p className="text-sm text-destructive mt-1">
                    {personalInfoForm.formState.errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  {...personalInfoForm.register('last_name')}
                  placeholder="Enter your last name"
                />
                {personalInfoForm.formState.errors.last_name && (
                  <p className="text-sm text-destructive mt-1">
                    {personalInfoForm.formState.errors.last_name.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isUpdatingPersonalInfo}>
                {isUpdatingPersonalInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  {...passwordForm.register('current_password')}
                  placeholder="Enter your current password"
                />
                {passwordForm.formState.errors.current_password && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.current_password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  {...passwordForm.register('new_password')}
                  placeholder="Enter your new password"
                />
                {passwordForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  {...passwordForm.register('confirm_password')}
                  placeholder="Confirm your new password"
                />
                {passwordForm.formState.errors.confirm_password && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Feature Toggles Section */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>
              Enable or disable features. Disabling a feature will hide it from navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bills-toggle" className="text-base">Bill Tracker</Label>
                <p className="text-sm text-muted-foreground">
                  Track and manage your bills and expenses
                </p>
              </div>
              <Switch
                id="bills-toggle"
                checked={userPreferences?.bills_enabled ?? true}
                onCheckedChange={(checked) => updateUserPreferences({ bills_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="doordash-toggle" className="text-base">DoorDash Earnings</Label>
                <p className="text-sm text-muted-foreground">
                  Track your DoorDash sessions and earnings
                </p>
              </div>
              <Switch
                id="doordash-toggle"
                checked={userPreferences?.doordash_enabled ?? false}
                onCheckedChange={(checked) => updateUserPreferences({ doordash_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenance-toggle" className="text-base">Home Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Track home maintenance tasks and receive email reminders
                </p>
              </div>
              <Switch
                id="maintenance-toggle"
                checked={userPreferences?.home_maintenance_enabled ?? false}
                onCheckedChange={(checked) => updateUserPreferences({ home_maintenance_enabled: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
