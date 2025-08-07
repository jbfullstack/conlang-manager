export interface Property {
  id: string;
  name: string;
  description: string;
  category: string;
  usageCount: number;
  isActive: boolean;
  conceptProperties?: {
    concept: {
      id: string;
      mot: string;
      type: string;
    };
  }[];
  createdAt: string;
}
