'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StaffSelect } from '@/components/ui/staff-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const visitorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  company: z.string().min(1, 'Company, branch, or organization is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  whomToSee: z.string().min(1, 'Please select who you are here to see'),
  reasonForVisit: z.string().optional(), // Make optional for backward compatibility
});

type VisitorFormData = z.infer<typeof visitorSchema>;

export default function CheckInPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const { toast } = useToast();

  // Fetch staff list from database
  const { data: staffList = [], isLoading: isLoadingStaff } = trpc.staff.getActiveStaff.useQuery();

  // Fetch company suggestions for auto-complete (only if tables exist)
  const { data: companySuggestions = [] } = trpc.company.getSuggestions.useQuery(
    { query: companyQuery },
    { enabled: companyQuery.length >= 2, retry: false, refetchOnMount: false }
  );

  const createVisitor = trpc.visitor.create.useMutation({
    onSuccess: async (data) => {
      setIsSubmitted(true);
      setVisitorName(data.fullName);
      toast({
        title: 'Check-in successful!',
        description: 'Thank you for checking in.',
      });
      // ✅ Notification is automatically created server-side in visitor.create mutation
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check in. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitorFormData>({
    resolver: zodResolver(visitorSchema),
  });

  const onSubmit = async (data: VisitorFormData) => {
    await createVisitor.mutateAsync({
      fullName: data.fullName,
      company: data.company,
      email: data.email,
      phone: data.phone,
      whomToSee: data.whomToSee,
      reasonForVisit: data.reasonForVisit,
      photoUrl: undefined, // Photo is optional now
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 safe-area-inset">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Thank You, {visitorName}!</CardTitle>
            <CardDescription className="mt-2">
              You're checked in. Please wait to be attended to.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button
              onClick={() => {
                setIsSubmitted(false);
                window.location.reload();
              }}
              className="w-full"
            >
              Check In Another Visitor
            </Button>
            <Link href="/visitor">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 safe-area-inset">
      <Card className="w-full max-w-2xl shadow-lg border-0">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/visitor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <CardTitle className="text-2xl font-semibold text-center text-gray-900">Visitor Check-In</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Please fill out the form below to check in
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
              <Input
                id="fullName"
                {...register('fullName')}
                placeholder="Enter your full name"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Company/Organization */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">Company, Branch, or Organization *</Label>
              <Input
                id="company"
                {...register('company')}
                onChange={(e) => {
                  setCompanyQuery(e.target.value);
                  setValue('company', e.target.value);
                }}
                placeholder="Enter company, branch, organization, or location"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                autoComplete="off"
                list="company-suggestions"
              />
              {companySuggestions.length > 0 && companyQuery.length >= 2 && (
                <datalist id="company-suggestions">
                  {companySuggestions.map((suggestion) => (
                    <option key={suggestion.id} value={suggestion.name} />
                  ))}
                </datalist>
              )}
              <p className="text-xs text-gray-500">For independent visitors, enter your location or "N/A"</p>
              {errors.company && (
                <p className="text-sm text-red-600 mt-1">{errors.company.message}</p>
              )}
            </div>

            {/* Reason for Visit - Optional for now */}
            <div className="space-y-2">
              <Label htmlFor="reasonForVisit" className="text-sm font-medium text-gray-700">Reason for Visit</Label>
              <select
                id="reasonForVisit"
                {...register('reasonForVisit')}
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">Select a reason (optional)...</option>
                <option value="Meeting">Meeting</option>
                <option value="Delivery">Delivery</option>
                <option value="Interview">Interview</option>
                <option value="Service">Service</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Consultation">Consultation</option>
                <option value="Other">Other</option>
              </select>
              {errors.reasonForVisit && (
                <p className="text-sm text-red-600 mt-1">{errors.reasonForVisit.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="your.email@example.com"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1-555-0100"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Whom to See */}
            <div className="space-y-2">
              <Label htmlFor="whomToSee" className="text-sm font-medium text-gray-700">Who are you here to see? *</Label>
              {isLoadingStaff ? (
                <div className="h-11 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                  <p className="text-sm text-gray-500">Loading staff list...</p>
                </div>
              ) : staffList.length === 0 ? (
                <div className="h-11 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                  <p className="text-sm text-gray-500">No staff members available. Please contact reception.</p>
                </div>
              ) : (
                <StaffSelect
                  options={staffList}
                  value={watch('whomToSee')}
                  onValueChange={(value) => setValue('whomToSee', value)}
                  placeholder="Search and select a staff member..."
                  className="h-11 border-gray-300"
                />
              )}
              {errors.whomToSee && (
                <p className="text-sm text-red-600 mt-1">{errors.whomToSee.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-base font-medium mt-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Checking In...' : 'Check In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

