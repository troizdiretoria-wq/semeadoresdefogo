import test from 'node:test';
import assert from 'node:assert/strict';

interface TestUser {
  id: string;
  name: string;
  role: 'admin_global' | 'coordenador_regional' | 'lider_evangelismo' | 'equipe_consolidacao' | 'equipe_ensino' | 'equipe_midia';
  regionId: string | null;
  status: 'active' | 'inactive';
}

function canAccessModule(user: TestUser | null, moduleKey: string): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin_global') return true;

  switch (moduleKey) {
    case 'dashboard':
    case 'evangelisms':
    case 'reports':
    case 'departments':
    case 'courses':
      return true;
    case 'regions':
      return user.role === 'coordenador_regional';
    case 'consolidation':
      return user.role === 'equipe_consolidacao' || user.role === 'coordenador_regional';
    default:
      return false;
  }
}

function enforceRegionalScope(user: TestUser | null, targetRegionId?: string): boolean {
  if (!user || user.status !== 'active') return false;
  if (user.role === 'admin_global') return true;
  if (!targetRegionId) return true;
  return user.regionId === targetRegionId;
}

test('RBAC: unauthenticated or inactive user is rejected from all modules', () => {
  assert.equal(canAccessModule(null, 'dashboard'), false);
  const inactiveAdmin: TestUser = { id: 'u1', name: 'Arthur', role: 'admin_global', regionId: null, status: 'inactive' };
  assert.equal(canAccessModule(inactiveAdmin, 'dashboard'), false);
  assert.equal(enforceRegionalScope(inactiveAdmin, 'reg-sp-01'), false);
});

test('RBAC: admin_global can access all modules and any regional scope', () => {
  const admin: TestUser = { id: 'u1', name: 'Arthur', role: 'admin_global', regionId: null, status: 'active' };
  assert.equal(canAccessModule(admin, 'dashboard'), true);
  assert.equal(canAccessModule(admin, 'regions'), true);
  assert.equal(canAccessModule(admin, 'consolidation'), true);
  assert.equal(enforceRegionalScope(admin, 'reg-sp-01'), true);
  assert.equal(enforceRegionalScope(admin, 'reg-mg-01'), true);
});

test('RBAC: coordenador_regional is restricted to their assigned region', () => {
  const coordSP: TestUser = { id: 'u2', name: 'Lucas', role: 'coordenador_regional', regionId: 'reg-sp-01', status: 'active' };
  assert.equal(canAccessModule(coordSP, 'regions'), true);
  assert.equal(canAccessModule(coordSP, 'consolidation'), true);
  assert.equal(enforceRegionalScope(coordSP, 'reg-sp-01'), true);
  assert.equal(enforceRegionalScope(coordSP, 'reg-mg-01'), false);
});

test('RBAC: lider_evangelismo cannot access regions management or other regionals', () => {
  const leader: TestUser = { id: 'u3', name: 'Thiago', role: 'lider_evangelismo', regionId: 'reg-sp-01', status: 'active' };
  assert.equal(canAccessModule(leader, 'evangelisms'), true);
  assert.equal(canAccessModule(leader, 'regions'), false);
  assert.equal(canAccessModule(leader, 'consolidation'), false);
  assert.equal(enforceRegionalScope(leader, 'reg-sp-01'), true);
  assert.equal(enforceRegionalScope(leader, 'reg-rj-01'), false);
});

test('RBAC: equipe_consolidacao has access to consolidation module in their region', () => {
  const consol: TestUser = { id: 'u4', name: 'Sarah', role: 'equipe_consolidacao', regionId: 'reg-sp-01', status: 'active' };
  assert.equal(canAccessModule(consol, 'consolidation'), true);
  assert.equal(canAccessModule(consol, 'regions'), false);
  assert.equal(enforceRegionalScope(consol, 'reg-sp-01'), true);
  assert.equal(enforceRegionalScope(consol, 'reg-mg-01'), false);
});
