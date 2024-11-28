export interface Question {
  id: string;
  text: string;
  options: string[];
  isActive: boolean;
  order: number;
  votes: Record<string, number>;
}

export interface User {
  id: string;
  isAdmin: boolean;
  email: string;
}