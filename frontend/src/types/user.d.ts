

interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  nodes: Operation[];
  trees: Discussion[];
}