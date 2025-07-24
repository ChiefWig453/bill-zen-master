export interface BillTemplate {
  id: string;
  name: string;
  amount?: number;
  category: string;
  description?: string;
  createdAt: string;
}

export const TEMPLATE_CATEGORIES = [
  'Utilities',
  'Rent/Mortgage', 
  'Insurance',
  'Credit Card',
  'Subscription',
  'Phone',
  'Internet',
  'Other'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];