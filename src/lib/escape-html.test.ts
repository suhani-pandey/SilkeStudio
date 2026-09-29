import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/escape-html";

describe("escapeHtml", () => {
  it("neutralises markup a customer might type into their name", () => {
    expect(escapeHtml(`<img src=x onerror="alert('hi')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;hi&#39;)&quot;&gt;",
    );
  });

  it("escapes ampersands first so existing entities aren't half-escaped", () => {
    expect(escapeHtml("Tom & Jerry &lt;")).toBe("Tom &amp; Jerry &amp;lt;");
  });

  it("leaves ordinary Danish names untouched", () => {
    expect(escapeHtml("Søren Ærø")).toBe("Søren Ærø");
  });
});
