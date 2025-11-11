'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Key, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const staffSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  department: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['Employee', 'Receptionist', 'Admin', 'IT Staff']).default('Employee'),
  isActive: z.boolean().default(true),
  canLogin: z.boolean().default(false),
  username: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

export default function StaffManagementPage() {
  const { toast } = useToast();
  const { orgId } = useAuth(); // ✅ Get orgId from client
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // ✅ Auto-sync organization to database on page load
  const syncOrgMutation = trpc.organization.syncToDB.useMutation({
    onSuccess: (data) => {
      console.log('[Staff Page] Organization synced to database:', data.organization.name);
    },
    onError: (error) => {
      console.error('[Staff Page] Failed to sync organization:', error);
    },
  });

  useEffect(() => {
    // Sync organization once on mount
    if (!syncOrgMutation.isPending && !syncOrgMutation.isSuccess) {
      syncOrgMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: staff = [], refetch, isLoading, error } = trpc.staff.getAll.useQuery(undefined, {
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
  const createStaff = trpc.staff.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Staff member added successfully.',
      });
      refetch();
      setIsDialogOpen(false);
      reset();
      
      // Show password if generated
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        setShowPasswordDialog(true);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member.',
        variant: 'destructive',
      });
    },
  });

  const updateStaff = trpc.staff.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Staff member updated successfully.',
      });
      refetch();
      setIsDialogOpen(false);
      setEditingStaff(null);
      reset();
      
      // Show password if generated (for newly enabled login)
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        setShowPasswordDialog(true);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member.',
        variant: 'destructive',
      });
    },
  });

  const resetPassword = trpc.staff.resetPassword.useMutation({
    onSuccess: (data) => {
      if (data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
        setShowPasswordDialog(true);
      }
      toast({
        title: 'Success',
        description: 'Password reset successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password.',
        variant: 'destructive',
      });
    },
  });

  const deleteStaff = trpc.staff.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Staff member deleted successfully.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete staff member.',
        variant: 'destructive',
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      isActive: true,
      canLogin: false,
    },
  });

  const canLogin = watch('canLogin');

  const onSubmit = (data: StaffFormData) => {
    if (editingStaff) {
      updateStaff.mutate({
        id: editingStaff.id,
        fullName: data.fullName,
        email: data.email || null,
        department: data.department || null,
        title: data.title || null,
        isActive: data.isActive,
        canLogin: data.canLogin,
        username: data.username || null,
      });
    } else {
      // ✅ Check if orgId exists before creating
      if (!orgId) {
        toast({
          title: 'Error',
          description: 'No organization selected. Please select your organization from the dropdown.',
          variant: 'destructive',
        });
        return;
      }

      createStaff.mutate({
        organizationId: orgId, // ✅ Pass orgId from client
        fullName: data.fullName,
        email: data.email || null,
        department: data.department || null,
        title: data.title || null,
        role: data.role,
        isActive: data.isActive,
        canLogin: data.canLogin,
        username: data.username || null,
      });
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    reset({
      fullName: staffMember.fullName,
      email: staffMember.email || '',
      department: staffMember.department || '',
      title: staffMember.title || '',
      role: staffMember.role as 'Employee' | 'Receptionist' | 'Admin' | 'IT Staff' || 'Employee',
      isActive: staffMember.isActive,
      canLogin: staffMember.canLogin || false,
      username: staffMember.username || '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    reset({
      fullName: '',
      email: '',
      department: '',
      title: '',
      role: 'Employee',
      isActive: true,
      canLogin: false,
      username: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteStaff.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 md:py-8 px-3 md:px-4">
        <Card>
          <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Staff Management</CardTitle>
              <CardDescription className="text-xs md:text-sm">Manage staff members who can receive visitors</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingStaff(null);
                reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} size="sm" className="text-xs md:text-sm self-start sm:self-auto">
                  <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
                <DialogDescription>
                  {editingStaff
                    ? 'Update staff member information.'
                    : 'Add a new staff member to the system.'}
                </DialogDescription>
              </DialogHeader>
              <form 
                onSubmit={handleSubmit(onSubmit)} 
                className="flex flex-col flex-1 min-h-0"
                autoComplete="off"
                data-form-type="other"
              >
                <div className="space-y-4 overflow-y-auto pr-2 flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                      placeholder="John Doe"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-600">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="john.doe@example.com"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      {...register('department')}
                      placeholder="Engineering"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Manager"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <select
                      id="role"
                      {...register('role')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Employee">Employee</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Admin">Admin</option>
                      <option value="IT Staff">IT Staff</option>
                    </select>
                    <p className="text-xs text-gray-500">
                      <strong>Employee:</strong> Access to employee dashboard only<br />
                      <strong>Receptionist:</strong> Access to visitor management<br />
                      <strong>Admin:</strong> Full system access<br />
                      <strong>IT Staff:</strong> Access to IT tickets + employee features
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active (visible to visitors)
                    </Label>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id="canLogin"
                        {...register('canLogin')}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="canLogin" className="cursor-pointer font-semibold">
                        Allow Login Access
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Enable this to create login credentials for this staff member
                    </p>

                    {canLogin && (
                      <>
                        <div className="space-y-2 mb-3">
                          <Label htmlFor="username" className="text-sm">Username (optional)</Label>
                          <Input
                            id="username"
                            {...register('username')}
                            placeholder="Auto-generated from email if not provided"
                            className="text-sm"
                            autoComplete="off"
                            data-lpignore="true"
                            data-form-type="other"
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave blank to auto-generate from email
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> A temporary password will be generated and displayed after saving. 
                            The staff member should change it upon first login.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t mt-4 flex-shrink-0 bg-white">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingStaff(null);
                      reset();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createStaff.isPending || updateStaff.isPending}
                    className="flex-1"
                  >
                    {createStaff.isPending || updateStaff.isPending
                      ? 'Saving...'
                      : editingStaff
                      ? 'Update'
                      : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
          {isLoading ? (
            <div className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base">
              Loading staff members...
            </div>
          ) : error ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-red-600 mb-2 text-sm md:text-base">Error loading staff members</p>
              <p className="text-xs md:text-sm text-gray-500">{error.message}</p>
              <Button onClick={() => refetch()} variant="outline" className="mt-4" size="sm">
                Retry
              </Button>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-6 md:py-8 text-gray-500 text-sm md:text-base">
              No staff members yet. Click "Add Staff Member" to get started.
            </div>
          ) : (
            <>
              {/* Mobile view - Cards */}
              <div className="md:hidden space-y-3">
                {staff.map((member) => (
                  <Card key={member.id} className="border">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{member.fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate">{member.email || 'N/A'}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ml-2 ${
                            member.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 mb-3">
                        <p><span className="font-medium">Department:</span> {member.department || '-'}</p>
                        <p><span className="font-medium">Title:</span> {member.title || '-'}</p>
                        <p><span className="font-medium">Role:</span> {member.role || 'Employee'}</p>
                      </div>
                      <div className="flex gap-2">
                        {member.canLogin && (
                          <span className="px-2 py-1 rounded-full text-xs whitespace-nowrap bg-blue-100 text-blue-800 mb-2 inline-block">
                            <Key className="inline h-3 w-3 mr-1" />
                            Can Login
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {member.canLogin && member.clerkUserId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetPassword.mutate({ id: member.id })}
                            className="flex-1 text-xs"
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Reset Password
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="flex-1 text-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id, member.fullName)}
                          className="text-red-500 hover:text-red-600 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Desktop view - Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Name</TableHead>
                      <TableHead className="text-sm">Email</TableHead>
                      <TableHead className="text-sm">Department</TableHead>
                      <TableHead className="text-sm">Title</TableHead>
                      <TableHead className="text-sm">Role</TableHead>
                      <TableHead className="text-sm">Status</TableHead>
                      <TableHead className="text-sm">Login</TableHead>
                      <TableHead className="text-right text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-sm">{member.fullName}</TableCell>
                        <TableCell className="text-sm">{member.email || '-'}</TableCell>
                        <TableCell className="text-sm">{member.department || '-'}</TableCell>
                        <TableCell className="text-sm">{member.title || '-'}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs whitespace-nowrap bg-purple-100 text-purple-800">
                            {member.role || 'Employee'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                              member.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {member.canLogin ? (
                            <span className="px-2 py-1 rounded-full text-xs whitespace-nowrap bg-blue-100 text-blue-800">
                              Can Login
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {member.canLogin && member.clerkUserId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetPassword.mutate({ id: member.id })}
                                title="Reset Password"
                              >
                                <Key className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(member)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(member.id, member.fullName)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        </Card>

        {/* Password Display Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                Login Credentials Created
              </DialogTitle>
              <DialogDescription>
                Save these credentials securely. The password cannot be retrieved again.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-600">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                        {temporaryPassword}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(temporaryPassword || '');
                          toast({
                            title: 'Copied!',
                            description: 'Password copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-800">
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                      Staff member can now log in at /sign-in
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      They should change this password upon first login
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setTemporaryPassword(null);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

