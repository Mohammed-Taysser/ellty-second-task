import EntityService from '@/apps/entity-service';

class OperationService extends EntityService<
  Operation,
  CreateOperationPayload,
  UpdateOperationPayload
> {
  constructor() {
    super('operation');
  }
}

export default new OperationService();
