import { ROLES, ROLE_HOME } from './roles';

describe('roles', () => {
  it('ролей ровно 9: от SuperAdmin до ученика, сотрудников филиала и партнёра', () => {
    expect(ROLES).toHaveLength(9);
  });

  it('у каждой роли есть своя панель', () => {
    ROLES.forEach((role) => expect(ROLE_HOME[role]).toMatch(/^\//));
  });
});
