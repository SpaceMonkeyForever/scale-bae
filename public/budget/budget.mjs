import { locale, t } from "./language.mjs";

// All supported currencies are stored in hundredths of the selected unit.
export const currencies = ["GBP", "IDR", "USD", "EUR", "SGD"];
export const maxMinor = 999999999900;
export function hasAmounts(book) {
  return book.allocated != null || !!book.bank || [book.basics, book.extras, book.topups].some(items => items.length);
}
export function bookCurrency(book, username, displayName) {
  if (book.currency) return book.currency;
  const squishy = [username, displayName].some(name => name?.trim().toLowerCase() === "squishy");
  return squishy ? "IDR" : "GBP";
}
export const emptyBudget = (currency = "GBP") => ({currency, start:"", end:"", allocated:null, topups:[], basics:[], extras:[]});
export const hasPeriod = b => b.allocated !== null && Boolean(b.start && b.end);
export const sample = {
  currency: "GBP", start: "2026-11-01", end: "2027-01-31", allocated: 240000, topups: [],
  basics: [
    { id: "rent", name: "Rent", amount: 165000, status: "paid", until: "2027-01-31", icon: "home", color: "lilac" },
    { id: "bike", name: "Bike", amount: 12000, status: "reserved", until: "2027-01-31", icon: "bike", color: "mint" },
    { id: "electricity", name: "Electricity", amount: 19500, status: "paid", until: "2026-11-30", icon: "bolt", color: "lemon" },
    { id: "groceries", name: "Groceries", amount: 31500, status: "reserved", until: "2027-01-31", icon: "basket", color: "peach" }
  ],
  extras: [
    { id: "tyre", name: "New bike tyre", amount: 4800, reason: "My old one split on the way home.", icon: "tool", color: "peach" },
    { id: "pharmacy", name: "Pharmacy visit", amount: 2400, reason: "An unexpected prescription.", icon: "plus-box", color: "rose" }
  ]
};
const sum = items => items.reduce((total, item) => total + item.amount, 0);
const exampleItems = new Map([...sample.basics, ...sample.extras].map(item => [item.id,item]));
export function itemText(item, field) {
  const value = item[field] ?? "";
  return exampleItems.get(item.id)?.[field] === value ? t(value) : value;
}
export function totals(budget) {
  const topups = sum(budget.topups), basics = sum(budget.basics), extras = sum(budget.extras);
  return { topups, basics, extras, remaining: hasPeriod(budget) ? budget.allocated + topups - basics - extras : null };
}
export function money(minor, currency = "GBP", language = locale) {
  return new Intl.NumberFormat(language, {style:"currency", currency, minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits:2}).format(minor / 100);
}
export function dateLabel(value, year = false, language = locale) {
  return new Intl.DateTimeFormat(language, {day:"numeric", month:"short", ...(year && {year:"numeric"}), timeZone:"UTC"}).format(new Date(value + "T12:00:00Z"));
}
export function cycle(b, language = locale) { return dateLabel(b.start, b.start.slice(0,4) !== b.end.slice(0,4), language) + " – " + dateLabel(b.end,true,language); }
export function coverage(item, full = false, language = locale) {
  if (item.status === "planned") return t("Still to cover", {}, language);
  return t(item.status === "paid" ? "Paid through {date}" : "Set aside through {date}", {date:dateLabel(item.until, full, language)}, language);
}
export function shareReport(book) {
  const en = "en-GB";
  const fmt = value => money(value, book.currency, en);
  const {topups, basics, extras, remaining} = totals(book);
  const intro = remaining < 0 ? `Could you send ${fmt(-remaining)} more to cover this period?` :
    remaining === 0 ? "Everything fits exactly. I have all I need for this period." :
    `I have ${fmt(remaining)} to spare after the basics and extras. I’m covered for this period.`;
  return {
    period:cycle(book, en), intro,
    rows:[
      ["Original allocation", fmt(book.allocated)],
      ...book.topups.map(x => ["Top-up · " + x.name, "+" + fmt(x.amount)]),
      ["Basics for the period", "−" + fmt(basics)],
      ["Outside the plan", "−" + fmt(extras)],
      [remaining < 0 ? "Top-up needed" : "Left over", fmt(Math.abs(remaining))]
    ],
    basics:book.basics.map(x => [x.name, fmt(x.amount), coverage(x, true, en)]),
    extras:book.extras.map(x => [x.name, fmt(x.amount), x.reason]),
    reconciliation:`Received ${fmt(book.allocated + topups)} − basics ${fmt(basics)} − extras ${fmt(extras)} = ${fmt(Math.abs(remaining))} ${remaining < 0 ? "short" : "left"}.`
  };
}
export function letterFromReport(report) {
  const details = items => items.map(([name, amount, note]) => "• " + name + " — " + amount + (note ? " · " + note : ""));
  return ["Hi Squeezy,", "", report.intro, "", "My budget for " + report.period,
    ...report.rows.map(([label, value]) => label + ": " + value), "", "The basics", ...details(report.basics),
    "", "Outside the plan", ...(report.extras.length ? details(report.extras) : ["No extras this period."]),
    "", report.reconciliation].join("\n");
}
export const letter = book => letterFromReport(shareReport(book));
export const examples = {
  repair: "I spent {amount} on a bike repair because my brakes stopped working.",
  electricity: "I paid the electricity through 31 January 2027.",
  topup: "Squeezy sent me another {amount}."
};
