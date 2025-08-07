import { Property } from "./property.interface";

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

export interface ConceptProperty {
  id: string;
  conceptId: string;
  propertyId: string;
  property: Property;
  createdAt: string;
}