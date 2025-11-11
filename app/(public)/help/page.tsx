'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, HelpCircle, Mail, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const faqs = [
  {
    question: 'How do I check in as a visitor?',
    answer: 'Navigate to the visitor page, click "Check In", and fill out the required information including your name, company, contact details, and who you\'re here to see. Once submitted, you\'ll receive a confirmation.',
  },
  {
    question: 'How do I check out?',
    answer: 'From the visitor page, click "Check Out", search for your name or company, and click the "Check Out" button next to your entry. You can also check out all visitors from your company at once.',
  },
  {
    question: 'What information do I need to provide during check-in?',
    answer: 'You need to provide your full name, company name, email address, phone number, and select the staff member you\'re visiting from the dropdown list.',
  },
  {
    question: 'Can I check in multiple visitors from my company?',
    answer: 'Yes, each visitor must check in individually with their own information. However, during checkout, you can check out all visitors from your company at once.',
  },
  {
    question: 'How do I access the admin dashboard?',
    answer: 'The admin dashboard is accessible only to authorized personnel. You need to sign in with your admin credentials at /sign-in to access visitor management, analytics, and staff management features.',
  },
  {
    question: 'What analytics are available in the dashboard?',
    answer: 'The analytics dashboard provides overview metrics (total visits, average duration, peak times), visitor analytics (types, repeat vs new, most visited employees), and traffic insights (hourly volume, day trends, daily traffic patterns).',
  },
  {
    question: 'Can I export visitor data?',
    answer: 'Yes, authorized admins can export visitor logs as CSV files from both the main dashboard and the analytics page. Use the "Export CSV" or "Export Report" buttons.',
  },
  {
    question: 'How do I manage staff members?',
    answer: 'From the admin dashboard, navigate to "Staff Management" where you can add, edit, or remove staff members. You can also mark staff as active or inactive.',
  },
  {
    question: 'Is this app available offline?',
    answer: 'Yes, Syncco is a Progressive Web App (PWA). You can install it on your device for offline access and a full-screen experience. Look for the install prompt when you first visit the app.',
  },
  {
    question: 'How do I install the app on my tablet or phone?',
    answer: 'When you first visit the app, you\'ll see an install prompt. On iOS, tap the Share button and select "Add to Home Screen". On Android, look for the install banner or the install option in your browser menu.',
  },
];

export default function HelpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: 'Message Sent!',
        description: 'Thank you for contacting us. We\'ll get back to you soon.',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-6">
            <Image 
              src="/syncco_logo.svg" 
              alt="Syncco Logo" 
              width={120} 
              height={60}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">Help Center</h1>
          <p className="text-center text-gray-600">Find answers to common questions or contact us</p>
        </div>

        {/* FAQs Section */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6 text-blue-600" />
              Contact Us
            </CardTitle>
            <CardDescription>Can't find what you're looking for? Send us a message</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  rows={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Other Ways to Reach Us</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@lanterncybersecurity.com" className="text-blue-600 hover:underline">
                    support@lanterncybersecurity.com
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong> Available Monday-Friday, 9AM-5PM EST
                </p>
                <p>
                  <strong>Response Time:</strong> We typically respond within 24 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Need immediate assistance? Check out our{' '}
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            {' '}or{' '}
            <Link href="/visitor" className="text-blue-600 hover:underline">
              Visitor Portal
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Powered by Lantern Cybersecurity © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

