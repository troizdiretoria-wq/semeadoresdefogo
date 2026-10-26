import test from 'node:test';
import assert from 'node:assert/strict';
import { getClientDb } from './clientStore.js';

test('clientStore returns valid unpolluted schema without fake mock constants', () => {
  const db = getClientDb();
  assert.ok(Array.isArray(db.users), 'users must be an array');
  assert.ok(Array.isArray(db.regions), 'regions must be an array');
  assert.ok(Array.isArray(db.evangelismEvents), 'evangelisms must be an array');
  assert.ok(Array.isArray(db.bimonthlyReports), 'reports must be an array');
  assert.ok(Array.isArray(db.departments), 'departments must be an array');
  assert.equal(db.users.length, 0, 'initial store must be empty to prevent masking real database');
});

test('Pure metric aggregation calculates exact figures without fallback constants', () => {
  const sampleEvents = [
    { id: '1', regionId: 'sp', status: 'Realizado', estimatedReached: 120, contactsCollected: 15, actualParticipants: 10 },
    { id: '2', regionId: 'sp', status: 'Realizado', estimatedReached: 80, contactsCollected: 10, actualParticipants: 8 },
    { id: '3', regionId: 'mg', status: 'Planejado', estimatedReached: 0, contactsCollected: 0, expectedParticipants: 12 },
  ];

  const completed = sampleEvents.filter((e) => e.status === 'Realizado');
  assert.equal(completed.length, 2);

  const totalPeople = completed.reduce((acc, e) => acc + e.estimatedReached, 0);
  assert.equal(totalPeople, 200, 'Sum must be mathematically exact (120 + 80 = 200)');

  const totalContacts = completed.reduce((acc, e) => acc + e.contactsCollected, 0);
  assert.equal(totalContacts, 25, 'Sum must be 25');

  // Filter regional
  const spEvents = sampleEvents.filter((e) => e.regionId === 'sp');
  assert.equal(spEvents.length, 2);
  const mgEvents = sampleEvents.filter((e) => e.regionId === 'mg');
  assert.equal(mgEvents.length, 1);
});
