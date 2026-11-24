import { ROLES, ROLE_HOME } from './roles';

describe('roles', () => {
  it('ролей ровно 8: от SuperAdmin до ученика и сотрудников филиала', () => {
    expect(ROLES).toHaveLength(8);
  });

  it('у каждой роли есть своя панель', () => {
    ROLES.forEach((role) => expect(ROLE_HOME[role]).toMatch(/^\//));
  });
});
