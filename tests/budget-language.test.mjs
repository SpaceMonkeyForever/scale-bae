import assert from "node:assert/strict";
import test from "node:test";
import { preferredLocale, setLocale } from "../public/budget/language.mjs";
import { itemText, letter, money, sample } from "../public/budget/budget.mjs";

test("Squishy defaults to Indonesian and a saved language takes precedence", () => {
  assert.equal(preferredLocale("Squishy"), "id-ID");
  assert.equal(preferredLocale("squishy", "en-GB"), "en-GB");
  assert.equal(preferredLocale("squishy", "invalid"), "id-ID");
  assert.equal(preferredLocale("Squeezy"), "en-GB");
  assert.equal(preferredLocale("Squeezy", "id-ID"), "id-ID");
});

test("localization formats GBP and translates only the original sample copy", () => {
  try {
    setLocale("id-ID");
    assert.match(money(123450), /1\.234,50/);
    const custom = {id:"personal", name:"Rent", amount:2000, reason:"My own words."};
    assert.equal(itemText(sample.basics[0],"name"), "Sewa tempat tinggal");
    assert.equal(itemText({...sample.basics[0],name:"Our rent"},"name"), "Our rent");
    assert.equal(itemText(custom,"name"), "Rent");
    const book = {...sample, extras:[custom]};
    assert.match(letter(book), /^Hi Squeezy,/);
    assert.match(letter(book), /Rent.*My own words/);
    setLocale("en-GB");
    assert.match(letter(book), /^Hi Squeezy,/);
  } finally { setLocale("en-GB"); }
});
