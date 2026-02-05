import * as React from "react";

import type { Customer } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CustomerEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onCancel: () => void;
};

export function CustomerEditSheet({
  open,
  onOpenChange,
  customer,
  onCancel,
}: CustomerEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg p-6">
        <SheetHeader>
          <SheetTitle>Edit customer</SheetTitle>
          <SheetDescription>
            Update the customer information and save changes.
          </SheetDescription>
        </SheetHeader>
        {customer ? (
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue={customer.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={customer.email} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" defaultValue={customer.company} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan</Label>
              <Input id="plan" defaultValue={customer.plan} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" defaultValue={customer.status} />
            </div>
            <div className="flex items-center gap-2">
              <Button className="flex-1">Save changes</Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
