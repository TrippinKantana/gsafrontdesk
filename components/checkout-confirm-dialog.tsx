'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CheckoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  visitorName?: string;
  companyName?: string;
  visitorCount?: number;
  isPending?: boolean;
}

export function CheckoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  visitorName,
  companyName,
  visitorCount,
  isPending = false,
}: CheckoutConfirmDialogProps) {
  const isBulkCheckout = !!companyName && visitorCount !== undefined;
  const title = isBulkCheckout
    ? `Check out all visitors from ${companyName}?`
    : `Check out ${visitorName}?`;
  
  const description = isBulkCheckout
    ? `Are you sure you want to check out all ${visitorCount} visitor(s) from ${companyName}? This action cannot be undone.`
    : `Are you sure you want to check out ${visitorName}? This action cannot be undone.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? 'Checking Out...' : 'Confirm Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

