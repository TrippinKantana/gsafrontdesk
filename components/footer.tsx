'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <p className="text-sm text-gray-600">
            © {currentYear} Lantern Cybersecurity. All rights reserved.
          </p>
          <Link 
            href="/help" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Need Help?
          </Link>
        </div>
      </div>
    </footer>
  );
}

