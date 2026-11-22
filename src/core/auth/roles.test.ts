import { ROLES, ROLE_HOME } from './roles';

describe('roles', () => {
  it('в MVP ровно 4 роли', () => {
    expect(ROLES).toHaveLength(8);
  });

  it('у каждой роли есть своя панель', () => {
    ROLES.forEach((role) => expect(ROLE_HOME[role]).toMatch(/^\//));
  });
});
