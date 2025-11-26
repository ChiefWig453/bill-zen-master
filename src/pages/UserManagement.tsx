import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, Search, Edit, Download, Filter } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { InviteUserDialog } from '@/components/InviteUserDialog';
import { EditUserDialog } from '@/components/EditUserDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  invited_by: string | null;
  invited_at: string | null;
}

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, roleFilter]);

  const filterProfiles = () => {
    let filtered = profiles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredProfiles(filtered);
  };

  const fetchProfiles = async () => {
    try {
      const users = await apiClient.getUsers();
      setProfiles(users);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      setProfiles(prev => prev.map(p => 
        p.id === userId ? { ...p, role: newRole } : p
      ));

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}.`
      });
    } catch (error) {
      // Don't log sensitive error details to console in production
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === profile?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiClient.deleteUser(userId);

      setProfiles(prev => prev.filter(p => p.id !== userId));

      toast({
        title: "User deleted",
        description: "User has been removed from the system."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteDialog(false);
    fetchProfiles();
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setEditingUser(null);
    fetchProfiles();
  };

  const editUser = (user: Profile) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Joined'],
      ...filteredProfiles.map(user => [
        `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Pending',
        user.email,
        user.role,
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;

    // Check if trying to delete own account
    if (selectedUsers.includes(profile?.id || '')) {
      toast({
        title: "Error",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Delete users one by one
      for (const userId of selectedUsers) {
        await apiClient.deleteUser(userId);
      }

      setProfiles(prev => prev.filter(p => !selectedUsers.includes(p.id)));
      setSelectedUsers([]);

      toast({
        title: "Users deleted",
        description: `${selectedUsers.length} user(s) have been deleted.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete users.",
        variant: "destructive"
      });
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const selectableUsers = filteredProfiles.filter(user => user.id !== profile?.id);
    setSelectedUsers(
      selectedUsers.length === selectableUsers.length 
        ? [] 
        : selectableUsers.map(user => user.id)
    );
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Manage users and their access to the system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={exportUsers}
                className="gap-2 flex-1 sm:flex-none"
                size="sm"
              >
                <Download className="h-4 w-4" />
                <span className="sm:inline">Export</span>
              </Button>
              <Button 
                onClick={() => setShowInviteDialog(true)} 
                className="gap-2 flex-1 sm:flex-none"
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="sm:inline">Invite</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            {selectedUsers.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={bulkDeleteUsers}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedUsers.length})
              </Button>
            )}
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-xl md:text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Admins</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-xl md:text-2xl font-bold">
                {profiles.filter(p => p.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="text-xl md:text-2xl font-bold">
                {profiles.filter(p => p.invited_at && !p.first_name).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <span className="text-lg md:text-xl">Users</span>
                <div className="text-xs md:text-sm font-normal text-muted-foreground">
                  Showing {filteredProfiles.length} of {profiles.length} users
                </div>
              </CardTitle>
            </CardHeader>
          <CardContent className="p-0 md:p-6">
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === filteredProfiles.filter(u => u.id !== profile?.id).length && filteredProfiles.length > 0}
                        onCheckedChange={selectAllUsers}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.id !== profile?.id && (
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || 'Pending'
                        }
                        {user.id === profile?.id && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editUser(user)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {user.role !== 'admin' && user.id !== profile?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'admin')}
                            >
                              Make Admin
                            </Button>
                          )}
                          {user.role === 'admin' && user.id !== profile?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'user')}
                            >
                              Remove Admin
                            </Button>
                          )}
                          {user.id !== profile?.id && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {filteredProfiles.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {user.id !== profile?.id && (
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => toggleSelectUser(user.id)}
                              />
                            )}
                            <h3 className="font-medium text-base">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name || 'Pending'
                              }
                            </h3>
                            {user.id === profile?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="shrink-0 text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editUser(user)}
                            className="gap-1 flex-1 h-9"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {user.role !== 'admin' && user.id !== profile?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'admin')}
                              className="flex-1 h-9 text-xs"
                            >
                              Make Admin
                            </Button>
                          )}
                          {user.role === 'admin' && user.id !== profile?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.id, 'user')}
                              className="flex-1 h-9 text-xs"
                            >
                              Remove Admin
                            </Button>
                          )}
                        </div>
                        {user.id !== profile?.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.id)}
                            className="w-full h-9"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite User Dialog */}
          <InviteUserDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            onSuccess={handleInviteSuccess}
          />

          <EditUserDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            user={editingUser}
            onSuccess={handleEditSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;