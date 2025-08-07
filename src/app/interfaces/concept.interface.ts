export interface Concept {
  id: string;
  mot: string;
  definition: string;
  type: string;
  proprietes: string[];
  etymologie?: string;
  exemples: string[];
  usageFrequency: number;
  user?: { username: string };
  createdAt: string;
}
