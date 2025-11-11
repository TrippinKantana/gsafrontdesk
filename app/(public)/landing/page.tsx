import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Calendar, 
  Shield, 
  Bell, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image 
                src="/syncco_logo.svg" 
                alt="Syncco" 
                width={120} 
                height={40}
                priority
                className="h-8 w-auto"
              />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Multi-Tenant Visitor Management Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Modern Visitor Management
            <br />
            <span className="text-blue-600">Built for Every Organization</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Streamline visitor check-ins, manage staff, schedule meetings, and enhance security—all in one powerful, easy-to-use platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/visitor">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2">
                Visitor Check-In
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Free forever for small teams
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Visitors
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern workplaces
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Visitor Management
              </h3>
              <p className="text-gray-600">
                Quick check-in/check-out with photo capture, host notifications, and real-time tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Meeting Scheduler
              </h3>
              <p className="text-gray-600">
                Schedule meetings, manage calendars, and sync with Google & Outlook seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multi-Organization
              </h3>
              <p className="text-gray-600">
                Perfect for SaaS—each organization gets isolated data, custom branding, and settings.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Notifications
              </h3>
              <p className="text-gray-600">
                Instant email/SMS alerts when visitors arrive. Accept or decline meetings on the go.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Role-Based Access
              </h3>
              <p className="text-gray-600">
                Admins, receptionists, employees, and IT staff—each with appropriate permissions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-gray-600">
                Track visitor patterns, peak hours, and generate detailed reports for compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Organizations Choose Syncco
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Quick Setup
                    </h3>
                    <p className="text-gray-600">
                      Get started in minutes. No complex configuration or technical expertise required.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Complete Data Isolation
                    </h3>
                    <p className="text-gray-600">
                      Each organization's data is completely separate and secure. Perfect for multi-tenant SaaS.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Mobile-Friendly
                    </h3>
                    <p className="text-gray-600">
                      Works perfectly on tablets and phones. Install as a PWA for native-like experience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      IT Support Built-In
                    </h3>
                    <p className="text-gray-600">
                      Integrated ticketing system for IT support. No need for separate help desk software.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <Globe className="h-12 w-12 mb-6 opacity-80" />
              <h3 className="text-2xl font-bold mb-4">
                Built for the Modern Workplace
              </h3>
              <p className="text-blue-100 mb-6">
                Whether you're a small business or a large enterprise, Syncco scales with your needs. 
                Support for multiple locations, unlimited visitors, and custom workflows.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-400">
                <div>
                  <div className="text-3xl font-bold mb-1">10K+</div>
                  <div className="text-sm text-blue-200">Visitors/month</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">99.9%</div>
                  <div className="text-sm text-blue-200">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">24/7</div>
                  <div className="text-sm text-blue-200">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 md:p-16 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Visitor Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join organizations worldwide using Syncco to create a professional, secure, and efficient visitor management system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Image 
                src="/syncco_logo.svg" 
                alt="Syncco" 
                width={120} 
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-600 max-w-sm">
                Modern visitor management platform designed for organizations of all sizes. 
                Secure, scalable, and easy to use.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/visitor" className="hover:text-blue-600">Visitor Check-In</Link></li>
                <li><Link href="/sign-up" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/sign-up" className="hover:text-blue-600">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
                <li><Link href="/sign-in" className="hover:text-blue-600">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 text-center text-gray-600">
            <p>© 2024 Syncco. All rights reserved. Built with ❤️ for modern workplaces.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

