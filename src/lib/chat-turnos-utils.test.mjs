import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./chat-turnos-utils.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

const loaded = { exports: {} };
new Function('exports', 'module', compiled.outputText)(loaded.exports, loaded);

const {
  parseBookingHints,
  filtrarHorariosPorRango,
  generarHorarios,
  getMissingFields,
  messageHasNameCue,
  parseNameFromMessage,
  hasSimilarToken,
  formatShortDate,
  parseLookupName,
  acceptsSuggestion,
  getArgentinaDateKey,
} = loaded.exports;

test('parsea mañana a la tarde y filtra horarios reales del rango tarde', () => {
  const now = new Date('2026-06-28T10:00:00-03:00');
  const hints = parseBookingHints('quiero agendar para mañana a la tarde', now);

  assert.equal(hints.fecha, '2026-06-29');
  assert.equal(hints.rango, 'tarde');
  assert.deepEqual(
    filtrarHorariosPorRango(['09:00', '12:00', '15:00', '18:20', '20:00'], hints.rango),
    ['15:00', '18:20']
  );
});

test('parsea dia de semana como proxima fecha', () => {
  const now = new Date('2026-06-28T10:00:00-03:00');
  const hints = parseBookingHints('turno para cortar el pelo el martes', now);

  assert.equal(hints.fecha, '2026-06-30');
});

test('genera slots por duración y detecta datos faltantes', () => {
  assert.deepEqual(generarHorarios('09:00', '11:00', 40), ['09:00', '09:40', '10:20']);
  assert.deepEqual(
    getMissingFields({ servicioId: '1', fecha: '2026-06-29', hora: '15:00' }),
    ['nombre', 'telefono']
  );
});

test('solo acepta nombre cuando el mensaje lo indica', () => {
  assert.equal(messageHasNameCue('soy Juan, mi numero es 3865123456'), true);
  assert.equal(messageHasNameCue('quiero agendar mañana a la tarde'), false);
  assert.equal(parseNameFromMessage('soy Juan Perez, 3865123456'), 'Juan Perez');
  assert.equal(parseNameFromMessage('Lautaro Jimenez 3865575688'), 'Lautaro Jimenez');
  assert.equal(parseNameFromMessage('Lautaro Jimenez', true), 'Lautaro Jimenez');
  assert.equal(parseNameFromMessage('turno para el martes', true), null);
});

test('detecta palabras parecidas para usuarios que escriben mal', () => {
  assert.equal(hasSimilarToken('quiero conbo completo', 'combo'), true);
  assert.equal(hasSimilarToken('me quiero cortarme el pelo', 'corte'), true);
  assert.equal(hasSimilarToken('turno martes', 'combo'), false);
});

test('formatea fecha para mensajes humanos', () => {
  assert.equal(formatShortDate('2026-06-30'), 'martes 30');
  assert.equal(formatShortDate('2026-07-01'), 'miércoles 01');
});

test('extrae nombre en pedidos de ver o cancelar turno', () => {
  assert.equal(parseLookupName('ver mi turno Franco'), 'Franco');
  assert.equal(parseLookupName('cancelar turno Lautaro Jimenez'), 'Lautaro Jimenez');
  assert.equal(parseLookupName('ver mi turno'), null);
});

test('detecta aceptacion de sugerencia', () => {
  assert.equal(acceptsSuggestion('si dale'), true);
  assert.equal(acceptsSuggestion('bueno ese dia'), true);
  assert.equal(acceptsSuggestion('no puedo'), false);
});

test('usa fecha de Argentina aunque el Date venga en UTC', () => {
  assert.equal(getArgentinaDateKey(new Date('2026-06-29T02:30:00.000Z')), '2026-06-28');
});
