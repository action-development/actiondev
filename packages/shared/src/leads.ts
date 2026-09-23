export type LeadStatus = "new" | "contacted" | "closed";

export interface Lead {
  id: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  createdAt: string;
}
