import * as React from "react";

import type { Customer } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

type CustomerViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
};

export function CustomerViewDialog({
  open,
  onOpenChange,
  customer,
}: CustomerViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Customer details</DialogTitle>
          <DialogDescription>Visualização dos Detalhes</DialogDescription>
        </DialogHeader>
        {customer ? (
          <div className="grid gap-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={customer.avatar || ""} />
                <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="font-medium">{customer.company}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="font-medium">{customer.region}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-medium">{customer.plan}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{customer.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seats</p>
                <p className="font-medium">{customer.seats}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">NPS</p>
                <p className="font-medium">{customer.nps}</p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
