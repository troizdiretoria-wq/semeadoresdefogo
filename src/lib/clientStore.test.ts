import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLocalMetrics, getClientDb } from './clientStore.js';

test('clientStore returns populated initial database', () => {
  const db = getClientDb();
  assert.ok(Array.isArray(db.users), 'users must be an array');
  assert.ok(db.users.length >= 5, 'must contain at least 5 users');
  assert.ok(Array.isArray(db.regions), 'regions must be an array');
  assert.ok(db.regions.length >= 3, 'must contain at least 3 regions');
  assert.ok(Array.isArray(db.evangelismEvents), 'evangelisms must be an array');
  assert.ok(Array.isArray(db.bimonthlyReports), 'reports must be an array');
  assert.ok(Array.isArray(db.departments), 'departments must be an array');
});

test('calculateLocalMetrics calculates valid global metrics', () => {
  const metrics = calculateLocalMetrics('ALL');
  assert.ok(metrics.totalRegions > 0, 'totalRegions should be > 0');
  assert.ok(metrics.activeRegions > 0, 'activeRegions should be > 0');
  assert.ok(metrics.totalMembers > 0, 'totalMembers should be > 0');
  assert.ok(metrics.totalPeopleReached > 0, 'totalPeopleReached should be > 0');
  assert.ok(Array.isArray(metrics.alerts), 'alerts should be an array');
});

test('calculateLocalMetrics calculates filtered regional metrics', () => {
  const spMetrics = calculateLocalMetrics('reg-sp-01');
  assert.ok(spMetrics.totalRegions > 0);
  assert.equal(typeof spMetrics.completedEvangelisms, 'number');
  assert.equal(typeof spMetrics.totalPeopleReached, 'number');
});
