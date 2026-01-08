"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, Users, Mail, Phone, MapPin } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/utils";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const customers = useQuery(api.customers.list, { search: search || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted">{customers?.length ?? 0} customer(s)</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers - Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {customers === undefined ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
          ))
        ) : customers.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center text-muted">
            <Users className="h-12 w-12 mx-auto mb-4" />
            No customers found
          </div>
        ) : (
          customers.map((customer) => (
            <div
              key={customer._id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{customer.name}</p>
                  {customer.address && (
                    <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{customer.address.city}, {customer.address.province}</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-accent">{formatPrice(customer.totalSpent)}</p>
                  <p className="text-xs text-muted">{customer.orderCount} order(s)</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <p className="text-xs text-muted">Joined {formatDate(customer.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customers Table - Desktop */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Orders</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Total Spent</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers === undefined ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-12 animate-pulse rounded bg-secondary" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.name}</p>
                      {customer.address && (
                        <div className="flex items-center gap-1 text-xs text-muted mt-1">
                          <MapPin className="h-3 w-3" />
                          {customer.address.city}, {customer.address.province}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {customer.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted" />
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{customer.orderCount} order(s)</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-sm text-muted">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
