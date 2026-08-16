import { formatDate, formatPrice } from "./format";

describe("formatPrice", () => {
    test.each([
        [599.99, "$599.99"],
        ["1200", "$1,200.00"],
        [null, "—"],
        [undefined, "—"],
        ["not-price", "—"],
    ])("formats %p as %s", (value, expected) => {
        expect(formatPrice(value)).toBe(expected);
    });
});

describe("formatDate", () => {
    test("formats a valid date", () => {
        expect(formatDate("2026-08-16T12:00:00Z")).toBe("Aug 16, 2026");
    });

    test.each([
        [null],
        [""],
        ["not-a-date"],
    ])("returns an em dash for %p", (value) => {
        expect(formatDate(value)).toBe("—");
    });
});