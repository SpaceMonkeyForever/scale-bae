import { locale, t } from "./language.mjs";

// Amounts are integer pence for the whole allocation period.
export const emptyBudget = () => ({start:"", end:"", allocated:null, topups:[], basics:[], extras:[]});
export const hasPeriod = b => b.allocated !== null && Boolean(b.start && b.end);
export const sample = {
  start: "2026-11-01", end: "2027-01-31", allocated: 240000, topups: [],
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
export function money(pence) {
  return new Intl.NumberFormat(locale, {style:"currency", currency:"GBP", minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits:2}).format(pence / 100);
}
export function dateLabel(value, year = false) {
  return new Intl.DateTimeFormat(locale, {day:"numeric", month:"short", ...(year && {year:"numeric"}), timeZone:"UTC"}).format(new Date(value + "T12:00:00Z"));
}
export function cycle(b) { return dateLabel(b.start, b.start.slice(0,4) !== b.end.slice(0,4)) + " – " + dateLabel(b.end,true); }
export function coverage(item, full = false) {
  if (item.status === "planned") return t("Still to cover");
  return t(item.status === "paid" ? "Paid through {date}" : "Set aside through {date}", {date:dateLabel(item.until, full)});
}
export function shareIntro(remaining) {
  if (remaining < 0) return t("Could you send {amount} more to cover this period?", {amount:money(-remaining)});
  if (remaining === 0) return t("Everything fits exactly. I have all I need for this period.");
  return t("I have {amount} to spare after the basics and extras. I’m covered for this period.", {amount:money(remaining)});
}
export function letter(b) {
  const summary = totals(b);
  const lines = [t("Hi Squeezy,"), "", shareIntro(summary.remaining), "", t("My budget for {period}", {period:cycle(b)}), t("Original allocation") + ": " + money(b.allocated)];
  b.topups.forEach(item => lines.push(t("Top-up") + " · " + item.name + ": +" + money(item.amount)));
  lines.push("", t("Basics") + " · " + money(summary.basics));
  b.basics.forEach(item => lines.push("• " + itemText(item,"name") + " — " + money(item.amount) + " · " + coverage(item, true)));
  lines.push("", t("Outside the plan") + " · " + money(summary.extras));
  b.extras.forEach(item => lines.push("• " + itemText(item,"name") + " — " + money(item.amount) + (item.reason ? ". " + itemText(item,"reason") : "")));
  if (!b.extras.length) lines.push(t("No extras this period."));
  const reconciliation = summary.remaining < 0 ? "Received {received} − basics {basics} − extras {extras} = {amount} short." : "Received {received} − basics {basics} − extras {extras} = {amount} left.";
  lines.push("", t(reconciliation, {received:money(b.allocated + summary.topups), basics:money(summary.basics), extras:money(summary.extras), amount:money(Math.abs(summary.remaining))}));
  return lines.join("\n");
}
export const examples = {
  repair: "I spent £95 on a bike repair because my brakes stopped working.",
  electricity: "I paid the electricity through 31 January 2027.",
  topup: "Squeezy sent me another £100."
};
