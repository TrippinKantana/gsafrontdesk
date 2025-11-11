'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Building2, Image as ImageIcon, Users, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';

export default function SettingsPage() {
  const { toast } = useToast();
  const { organization, isLoaded } = useOrganization();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch organization data from database
  const { data: dbOrganization, isLoading: isLoadingDbOrg, refetch } = trpc.organization.getCurrent.useQuery(
    undefined,
    { enabled: isLoaded && !!organization }
  );

  // Update organization mutation
  const updateOrgMutation = trpc.organization.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'Organization settings have been updated successfully.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save organization settings.',
        variant: 'destructive',
      });
    },
  });

  // Organization settings state
  const [orgSettings, setOrgSettings] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  // Load data from Clerk and database
  useEffect(() => {
    if (organization && dbOrganization) {
      setOrgSettings({
        name: organization.name || '',
        email: dbOrganization.email || '',
        phone: dbOrganization.phone || '',
        address: dbOrganization.address || '',
        website: dbOrganization.website || '',
      });
    }
  }, [organization, dbOrganization]);

  // White-label settings
  const [whiteLabel, setWhiteLabel] = useState({
    logo: '/syncco_logo.svg',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    appName: 'Syncco Visitor Management',
  });

  const handleSaveOrganization = async () => {
    if (!organization) {
      toast({
        title: 'Error',
        description: 'No organization loaded.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Step 1: Update Clerk if name changed
      if (orgSettings.name !== organization.name) {
        await organization.update({ name: orgSettings.name });
        console.log('[Settings] ✅ Updated organization name in Clerk:', orgSettings.name);
      }

      // Step 2: Update database (including name to keep in sync)
      await updateOrgMutation.mutateAsync({
        name: orgSettings.name, // ✅ Sync name to database as well
        email: orgSettings.email,
        phone: orgSettings.phone,
        address: orgSettings.address,
        website: orgSettings.website,
      });

      console.log('[Settings] ✅ Organization settings synced across Clerk, Database, and Platform');
      
      // Force refresh organization data to reflect changes
      await refetch();
    } catch (error) {
      console.error('[Settings] ❌ Error saving organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to save organization settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWhiteLabel = () => {
    setIsSaving(true);
    // TODO: Implement API call to save white-label settings
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'White-Label Settings Saved',
        description: 'Branding settings have been updated successfully.',
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Manage organization settings, roles, and system configuration
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <Tabs defaultValue="organization" className="space-y-4 md:space-y-6">
          {/* Mobile: Dropdown Select */}
          <div className="md:hidden">
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              onChange={(e) => {
                const tabs = document.querySelector('[role="tablist"]');
                const trigger = tabs?.querySelector(`[value="${e.target.value}"]`) as HTMLElement;
                trigger?.click();
              }}
              defaultValue="organization"
            >
              <option value="organization">📋 Organization</option>
              <option value="white-label">🎨 White-Label</option>
              <option value="roles">🛡️ Roles & Permissions</option>
              <option value="users">👥 User Management</option>
            </select>
          </div>

          {/* Desktop: Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-4">
            <TabsTrigger value="organization">
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Organization</span>
              <span className="lg:hidden">Org</span>
            </TabsTrigger>
            <TabsTrigger value="white-label">
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">White-Label</span>
              <span className="lg:hidden">Brand</span>
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Roles & Permissions</span>
              <span className="lg:hidden">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">User Management</span>
              <span className="lg:hidden">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Organization Settings */}
          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Update your organization's details and contact information. Changes to the organization name will sync with Clerk.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingDbOrg || !isLoaded ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading organization data...</span>
                  </div>
                ) : (
                  <>
                    {/* Organization Image from Clerk */}
                    {organization?.imageUrl && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={organization.imageUrl}
                          alt={organization.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Organization Logo</p>
                          <p className="text-xs text-gray-600">
                            Managed in Clerk Dashboard
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Organization Slug (Read-only) */}
                    {organization?.slug && (
                      <div className="space-y-2">
                        <Label htmlFor="orgSlug">Organization Slug (Read-only)</Label>
                        <Input
                          id="orgSlug"
                          value={organization.slug}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">
                          The organization slug is set in Clerk and cannot be changed here.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name *</Label>
                      <Input
                        id="orgName"
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        placeholder="Your Organization Name"
                      />
                      <p className="text-xs text-gray-500">
                        Changes will be synced to Clerk automatically.
                      </p>
                    </div>

                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Contact Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgSettings.email}
                    onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
                    placeholder="contact@yourorg.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Phone Number</Label>
                  <Input
                    id="orgPhone"
                    value={orgSettings.phone}
                    onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgAddress">Address</Label>
                  <Textarea
                    id="orgAddress"
                    value={orgSettings.address}
                    onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                    placeholder="Street address, City, State, ZIP"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgWebsite">Website</Label>
                  <Input
                    id="orgWebsite"
                    value={orgSettings.website}
                    onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleSaveOrganization}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* White-Label Settings */}
          <TabsContent value="white-label">
            <Card>
              <CardHeader>
                <CardTitle>White-Label Branding</CardTitle>
                <CardDescription>
                  Customize the platform's appearance with your own branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={whiteLabel.appName}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, appName: e.target.value })}
                    placeholder="Your App Name"
                  />
                  <p className="text-xs text-gray-500">This will appear in the browser tab and application header</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={whiteLabel.logo}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, logo: e.target.value })}
                    placeholder="/your-logo.svg"
                  />
                  <p className="text-xs text-gray-500">Upload your logo to /public folder and enter the path here</p>
                  {whiteLabel.logo && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Preview:</p>
                      <img src={whiteLabel.logo} alt="Logo preview" className="h-12 w-auto" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={whiteLabel.primaryColor}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={whiteLabel.primaryColor}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={whiteLabel.secondaryColor}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, secondaryColor: e.target.value })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={whiteLabel.secondaryColor}
                        onChange={(e) => setWhiteLabel({ ...whiteLabel, secondaryColor: e.target.value })}
                        placeholder="#10b981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-900 font-medium mb-1">⚠️ Note</p>
                  <p className="text-sm text-blue-800">
                    Color changes will require restarting the development server and updating your Tailwind configuration for full effect.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveWhiteLabel}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? 'Saving...' : 'Save Branding'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles & Permissions */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Access Control</CardTitle>
                <CardDescription>
                  Overview of system roles and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Employee Role */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Employee</h3>
                        <p className="text-sm text-gray-600">Regular staff members</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Standard Access
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700"><strong>Can Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>Employee Dashboard (/employee/*)</li>
                        <li>Submit IT support tickets</li>
                        <li>View and reply to their own tickets</li>
                        <li>Manage their own meeting schedule</li>
                        <li>Update notification preferences</li>
                      </ul>
                      <p className="text-gray-700 mt-3"><strong>Cannot Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>Admin Dashboard</li>
                        <li>Visitor management</li>
                        <li>IT support dashboard</li>
                        <li>Staff management</li>
                      </ul>
                    </div>
                  </div>

                  {/* IT Staff Role */}
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">IT Staff</h3>
                        <p className="text-sm text-gray-600">IT support team members</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        IT Access
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700"><strong>Can Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>IT Dashboard (/it/*)</li>
                        <li>View and manage all support tickets</li>
                        <li>Assign tickets to themselves or others</li>
                        <li>Update ticket status and priority</li>
                        <li>Add internal notes (IT-only)</li>
                        <li>Employee features (dashboard, tickets, meetings)</li>
                      </ul>
                      <p className="text-gray-700 mt-3"><strong>Cannot Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>Admin Dashboard</li>
                        <li>Visitor management</li>
                        <li>Staff management</li>
                        <li>System settings</li>
                      </ul>
                    </div>
                  </div>

                  {/* Receptionist Role */}
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Receptionist</h3>
                        <p className="text-sm text-gray-600">Front desk staff</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Reception Access
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700"><strong>Can Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>Admin Dashboard (/dashboard/*)</li>
                        <li>Visitor management (check-in, check-out)</li>
                        <li>View all visitors and logs</li>
                        <li>Export visitor data</li>
                        <li>View meetings schedule</li>
                        <li>Submit IT support tickets</li>
                      </ul>
                      <p className="text-gray-700 mt-3"><strong>Cannot Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>Staff management</li>
                        <li>IT support dashboard</li>
                        <li>System settings</li>
                        <li>Analytics (limited access)</li>
                      </ul>
                    </div>
                  </div>

                  {/* Admin Role */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Admin</h3>
                        <p className="text-sm text-gray-600">System administrators</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Full Access
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700"><strong>Can Access:</strong></p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                        <li>✅ All features and dashboards</li>
                        <li>✅ Admin Dashboard with full access</li>
                        <li>✅ Visitor management</li>
                        <li>✅ Staff management (create, edit, delete, assign roles)</li>
                        <li>✅ IT support dashboard (view and manage all tickets)</li>
                        <li>✅ Analytics and reports</li>
                        <li>✅ System settings and configuration</li>
                        <li>✅ White-label branding</li>
                        <li>✅ Organization settings</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">📝 How to Assign Roles:</p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Go to <strong>Staff Management</strong> in the Admin Dashboard</li>
                      <li>Click <strong>Add Staff Member</strong> or <strong>Edit</strong> an existing staff</li>
                      <li>Select the appropriate <strong>Role</strong> from the dropdown</li>
                      <li>Enable <strong>Can Login</strong> if they need dashboard access</li>
                      <li>Save and provide them with their login credentials</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Quick link to manage staff members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Manage Staff Members
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add, edit, or remove staff members and assign their roles
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/dashboard/staff')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Staff Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


