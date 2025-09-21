import { PVBase, PVTarget } from '@lib/client';

PVTarget.AddTarget({
  id: 'research::delete_entity',
  type: 'flag',
  group: ['isEntity'],
  data: [
    {
      id: 'delete_entity',
      label: 'Delete Entity',
      icon: 'recycle',
      event: 'research:client:delete_entity',
      parameters: {},
    },
  ],
  options: {
    distance: 3.0,
  },
});

on('research:client:delete_entity', (entity: number) => {
  PVBase.deleteEntity(entity);
});
