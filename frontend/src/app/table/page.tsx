"use client";

import * as React from "react";

import { DataTable } from "@/components/DataTable";
import { useBreadcrumb } from "@/components/layout/BreadcrumbContext";

import type { Customer } from "./types";
import { customers } from "./data";
import { useCustomerColumns } from "./columns";
import { CustomerViewDialog } from "./_components/customer-view-dialog";
import { CustomerEditSheet } from "./_components/customer-edit-sheet";

export default function TablePage() {
  const { setPageBreadcrumb } = useBreadcrumb();
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null);

  React.useEffect(() => {
    setPageBreadcrumb("Customers", [{ label: "Customers" }]);
  }, [setPageBreadcrumb]);

  React.useEffect(() => {
    if (!viewOpen) setSelectedCustomer(null);
  }, [viewOpen]);

  React.useEffect(() => {
    if (!editOpen) setSelectedCustomer(null);
  }, [editOpen]);

  const openView = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setViewOpen(true);
  }, []);

  const openEdit = React.useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setEditOpen(true);
  }, []);

  const columns = useCustomerColumns();

  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Pesquisar "
        summaryCards={{
          totalLabel: "Total",
          filteredLabel: "Filtrados",
          groupedLabel: "Grupos",
        }}
        showExportMenu
        rowActions={[
          {
            id: "view",
            label: "Visualizar",
            onSelect: openView,
          },
          {
            id: "edit",
            label: "Editar",
            onSelect: openEdit,
          },
          {
            id: "archive",
            label: "Archive customer",
            destructive: true,
            onSelect: () => {},
          },
        ]}
      />

      <CustomerViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        customer={selectedCustomer}
      />

      <CustomerEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={selectedCustomer}
        onCancel={() => setEditOpen(false)}
      />
    </div>
  );
}
