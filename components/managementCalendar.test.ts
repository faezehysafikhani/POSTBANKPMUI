import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthGrid, moveMonth, tehranDateTime, tehranDay } from './managementCalendar';

test('Persian calendar month lengths include leap Esfand', () => {
  assert.equal(monthGrid(1403,12).days,30);
  assert.equal(monthGrid(1404,12).days,29);
  assert.equal(monthGrid(1405,1).days,31);
  assert.equal(monthGrid(1405,7).days,30);
});
test('month navigation crosses the Persian year boundary', () => {
  assert.deepEqual(moveMonth(1405,12,1),{year:1406,month:1});
  assert.deepEqual(moveMonth(1405,1,-1),{year:1404,month:12});
});
test('calendar rows have seven cells and enumerate every day exactly once', () => {
  for(let month=1;month<=12;month++) {
    const grid=monthGrid(1405,month);
    assert.equal(grid.cells.length%7,0);
    assert.deepEqual(grid.cells.filter(value=>value!==null),Array.from({length:grid.days},(_,index)=>index+1));
  }
});
test('Tehran event time round-trips across a UTC date boundary', () => {
  const utc=tehranDateTime('1405/08/17','00:15');
  assert.deepEqual(tehranDay(utc),{jy:1405,jm:8,jd:17});
  assert.ok(utc.endsWith('20:45:00.000Z'));
});
test('invalid dates and hours are rejected before submission', () => {
  assert.throws(()=>tehranDateTime('1404/12/30','09:00'));
  assert.throws(()=>tehranDateTime('1405/08/17','25:00'));
});
