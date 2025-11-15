


interface Discussion extends BaseEntity{
  title: string;
  nodes: Operation[];
  user: User;
}
