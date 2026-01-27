export interface Ingredient {
  id: string;
  item: string;
  quantity: string;
  unit?: string;
  notes?: string;
}

export interface Instruction {
  id: string;
  stepNumber: number;
  description: string;
  image?: string;
  tips?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  galleryImages?: string[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  categories: Category[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}
