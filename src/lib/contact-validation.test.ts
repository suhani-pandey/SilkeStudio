import { describe, expect, it } from "vitest";
import { checkPhone, isEmailSyntaxValid, suggestEmailFix } from "@/lib/contact-validation";

describe("checkPhone", () => {
  it("accepts real Danish numbers however they're written", () => {
    for (const input of ["91719063", "91 71 90 63", "+45 91 71 90 63", "0045 91719063"]) {
      expect(checkPhone(input)).toEqual({ valid: true, e164: "+4591719063" });
    }
  });

  it("rejects numbers that fit the length but can't exist", () => {
    expect(checkPhone("12345678").valid).toBe(false);
    expect(checkPhone("00000000").valid).toBe(false);
  });

  it("rejects too-short and too-long input", () => {
    expect(checkPhone("9171906").valid).toBe(false);
    expect(checkPhone("917190631").valid).toBe(false);
    expect(checkPhone("").valid).toBe(false);
  });

  it("accepts international numbers written with a country code", () => {
    expect(checkPhone("+44 7911 123456")).toEqual({ valid: true, e164: "+447911123456" });
  });
});

describe("isEmailSyntaxValid", () => {
  it("accepts ordinary addresses", () => {
    expect(isEmailSyntaxValid("anna.hansen@gmail.com")).toBe(true);
    expect(isEmailSyntaxValid("søren@mail.dk")).toBe(true);
  });

  it("rejects the usual mistakes", () => {
    for (const bad of ["anna", "anna@", "@gmail.com", "anna@gmail", "anna @gmail.com", "a@b.c"]) {
      expect(isEmailSyntaxValid(bad)).toBe(false);
    }
  });
});

describe("suggestEmailFix", () => {
  it("catches the common domain typos", () => {
    expect(suggestEmailFix("anna@gmial.com")).toBe("anna@gmail.com");
    expect(suggestEmailFix("anna@gmail.con")).toBe("anna@gmail.com");
    expect(suggestEmailFix("anna@hotmial.dk")).toBe("anna@hotmail.dk");
  });

  it("leaves correct and unusual addresses alone", () => {
    expect(suggestEmailFix("anna@gmail.com")).toBeNull();
    expect(suggestEmailFix("anna@silkestudio.dk")).toBeNull();
    expect(suggestEmailFix("not-an-email")).toBeNull();
  });
});
