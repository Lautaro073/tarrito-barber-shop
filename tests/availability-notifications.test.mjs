import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/availability-policy.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { transition, availability, argentinaClock, availabilityMessage } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const state = (remaining, enabled = true) => ({ remaining, enabled });

test('only the four intended transitions produce events', () => {
  assert.equal(transition(state(0, false), state(10)), 'opened');
  assert.equal(transition(state(3), state(2)), 'low');
  assert.equal(transition(state(5), state(1)), 'low');
  assert.equal(transition(state(2), state(1)), null);
  assert.equal(transition(state(1), state(0)), 'full');
  assert.equal(transition(state(0), state(1)), 'reopened');
  assert.equal(transition(state(0), state(3)), 'reopened');
  assert.equal(transition(state(2), state(2)), null);
  assert.equal(transition(state(1), state(2)), null);
  assert.equal(transition(state(2), state(0, false)), null);
  assert.equal(transition(state(0, false), state(0)), null);
});

const schedules = [{ dia: 'Lunes', activo: true, franjas: [{ horaInicio: '10:00', horaFin: '12:00' }] }];
test('weekly opening starts at Sunday 16 Argentina time', () => {
  assert.equal(availability('2026-09-07', schedules, [40], [], new Date('2026-09-06T18:59:00Z')).enabled, false);
  assert.deepEqual(availability('2026-09-07', schedules, [40], [], new Date('2026-09-06T19:00:00Z')), state(3));
  assert.equal(availability('2026-09-14', schedules, [40], [], new Date('2026-09-06T19:00:00Z')).enabled, false);
});

test('bookings consume slots, cancellation releases them and duplicate services do not inflate count', () => {
  const now = new Date('2026-09-06T19:00:00Z');
  const appointments = ['10:00', '10:40', '11:20'].map(hora => ({ hora, estado: 'pendiente' }));
  assert.equal(availability('2026-09-07', schedules, [40, 40], appointments, now).remaining, 0);
  appointments[1].estado = 'cancelado';
  assert.equal(availability('2026-09-07', schedules, [40, 40], appointments, now).remaining, 1);
});

test('today excludes starts within 30 minutes and uses Argentina calendar day', () => {
  assert.equal(argentinaClock(new Date('2026-09-08T01:00:00Z')).date, '2026-09-07');
  assert.equal(availability('2026-09-07', schedules, [40], [], new Date('2026-09-07T13:10:00Z')).remaining, 1);
  assert.equal(availability('2026-09-07', schedules, [40], [], new Date('2026-09-08T13:00:00Z')).enabled, false);
});

test('message identifies the date and reopening clearly', () => {
  const message = availabilityMessage('reopened', '2026-09-07');
  assert.match(message.body, /Volvió a haber turnos disponibles/);
  assert.match(message.body, /lunes.*7.*septiembre/);
});
