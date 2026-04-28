import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks (vi.mock factories are hoisted before imports) ─────────────
const { mockGsapSet, mockGsapTo, mockGsapFromTo, mockScrollTriggerCreate } = vi.hoisted(() => ({
	mockGsapSet: vi.fn(),
	mockGsapTo: vi.fn(),
	mockGsapFromTo: vi.fn(),
	mockScrollTriggerCreate: vi.fn(),
}));

// ─── GSAP mocks ──────────────────────────────────────────────────────────────
vi.mock("gsap", () => ({
	gsap: {
		registerPlugin: vi.fn(),
		set: mockGsapSet,
		to: mockGsapTo,
		fromTo: mockGsapFromTo,
		context: vi.fn((fn: () => void) => {
			fn();
			return { revert: vi.fn() };
		}),
	},
	default: {
		registerPlugin: vi.fn(),
		set: mockGsapSet,
		to: mockGsapTo,
		fromTo: mockGsapFromTo,
		context: vi.fn((fn: () => void) => {
			fn();
			return { revert: vi.fn() };
		}),
	},
	ScrollTrigger: {
		create: mockScrollTriggerCreate,
		refresh: vi.fn(),
	},
}));

vi.mock("gsap/ScrollTrigger", () => ({
	ScrollTrigger: {
		create: mockScrollTriggerCreate,
		refresh: vi.fn(),
	},
}));

vi.mock("@gsap/react", async () => {
	// Run inside useEffect so refs are populated before the GSAP callback fires
	const { useEffect } = await vi.importActual<typeof import("react")>("react");
	return {
		useGSAP: vi.fn((fn: () => void) => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			useEffect(fn, []);
		}),
	};
});

// ─── Next.js / module mocks ───────────────────────────────────────────────────
vi.mock("next/image", () => ({
	default: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) => (
		<img src={src} alt={alt} {...rest} />
	),
}));

vi.mock("next/dynamic", () => ({
	default: () => () => null,
}));

vi.mock("@/data/testimonials", () => ({
	testimonials: [
		{
			id: "1",
			name: "Jane Doe",
			avatar: "/avatars/test.jpg",
			project: "Test Project",
			idea: "A challenging idea",
			quote: "Absolutely amazing results.",
		},
	],
}));

// ─── Component under test ─────────────────────────────────────────────────────
import { Testimonials } from "../Testimonials";

// ─────────────────────────────────────────────────────────────────────────────

describe("Testimonials — headline animation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ── Text content ──────────────────────────────────────────────────────────
	it("renders 'Trusted by' and 'visionaries' text", () => {
		render(<Testimonials />);
		expect(screen.getByText("Trusted by")).toBeInTheDocument();
		expect(screen.getByText("visionaries")).toBeInTheDocument();
	});

	// ── Initial DOM state: the h2 must be hidden and position-ready ───────────
	// Fixed elements are visible across ALL sections. Without visibility:hidden,
	// "Trusted by visionaries" overlays the Home/Projects sections on page load.
	it("headline starts with visibility:hidden (does not overlay other sections)", () => {
		render(<Testimonials />);
		// { hidden: true } is required because visibility:hidden excludes the element
		// from the accessible tree — exactly what we're testing for.
		const h2 = screen.getByRole("heading", { level: 2, hidden: true });
		expect(h2.style.visibility).toBe("hidden");
	});

	// The CSS left/top must be set as inline styles so the element is at the
	// correct position before useLayoutEffect (GSAP) fires, preventing CLS.
	it("headline has left:50% and top:50% as inline styles (correct before GSAP runs)", () => {
		render(<Testimonials />);
		const h2 = screen.getByRole("heading", { level: 2, hidden: true });
		expect(h2.style.left).toBe("50%");
		expect(h2.style.top).toBe("50%");
	});

	it("headline has 'fixed' positioning class", () => {
		render(<Testimonials />);
		const h2 = screen.getByRole("heading", { level: 2, hidden: true });
		expect(h2.className).toContain("fixed");
	});

	// ── CSS/GSAP conflict prevention ──────────────────────────────────────────
	// Tailwind CSS transform classes (-translate-x/y-*, left-1/2, top-1/2) write
	// to the CSS `transform` property which conflicts with GSAP's xPercent/yPercent
	// during scrub, causing jumps. GSAP must own the transform matrix exclusively.
	it("headline has NO Tailwind -translate-x-1/2 class (GSAP owns transform)", () => {
		render(<Testimonials />);
		expect(screen.getByRole("heading", { level: 2, hidden: true }).className).not.toContain("-translate-x-1/2");
	});

	it("headline has NO Tailwind -translate-y-1/2 class (GSAP owns transform)", () => {
		render(<Testimonials />);
		expect(screen.getByRole("heading", { level: 2, hidden: true }).className).not.toContain("-translate-y-1/2");
	});

	it("headline has NO Tailwind left-1/2 class (positioning via inline style only)", () => {
		render(<Testimonials />);
		expect(screen.getByRole("heading", { level: 2, hidden: true }).className).not.toContain("left-1/2");
	});

	it("headline has NO Tailwind top-1/2 class (positioning via inline style only)", () => {
		render(<Testimonials />);
		expect(screen.getByRole("heading", { level: 2, hidden: true }).className).not.toContain("top-1/2");
	});

	// ── GSAP setup ───────────────────────────────────────────────────────────
	// transformOrigin must be set once via gsap.set so the headline scales
	// from its top-left corner throughout the entire scrub range.
	it("calls gsap.set() with transformOrigin 'top left'", () => {
		render(<Testimonials />);
		const setCall = mockGsapSet.mock.calls.find(([, vars]) =>
			vars?.transformOrigin === "top left"
		);
		expect(setCall).toBeDefined();
	});

	// ── gsap.fromTo with guaranteed FROM state ────────────────────────────────
	// fromTo is used instead of gsap.to because with invalidateOnRefresh:true,
	// gsap.to would re-read FROM from the current painted position (mid-animation
	// after resize). fromTo always uses the declared FROM object — no drift.
	it("uses gsap.fromTo (not gsap.to) for the headline scroll animation", () => {
		render(<Testimonials />);
		expect(mockGsapFromTo).toHaveBeenCalled();
	});

	it("fromTo FROM state has left:50%, top:50%, xPercent:-50, yPercent:-50 (centered)", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, from]) =>
			from?.left === "50%" &&
			from?.top === "50%" &&
			from?.xPercent === -50 &&
			from?.yPercent === -50
		);
		expect(call).toBeDefined();
	});

	it("fromTo FROM state has scale:1 (full size at animation start)", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, from]) => from?.scale === 1);
		expect(call).toBeDefined();
	});

	it("fromTo TO state has xPercent:0 and yPercent:0 (no transform offset at end)", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, , to]) =>
			to?.xPercent === 0 && to?.yPercent === 0
		);
		expect(call).toBeDefined();
	});

	// ── invalidateOnRefresh — responsive recalculation ────────────────────────
	// Without it, the computed targetLeft is stale after window resize.
	it("scroll animation has invalidateOnRefresh:true", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, , to]) =>
			to?.scrollTrigger?.invalidateOnRefresh === true
		);
		expect(call).toBeDefined();
	});

	// ── Function-based left — re-evaluated on every refresh ───────────────────
	// A constant is computed once at mount and stale after resize.
	// A function is called again on each ScrollTrigger.refresh().
	it("fromTo TO 'left' is a function (re-evaluated on resize)", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, , to]) => typeof to?.left === "function");
		expect(call).toBeDefined();
	});

	it("left function returns a number ≥ 24 (min edge margin)", () => {
		render(<Testimonials />);
		const call = mockGsapFromTo.mock.calls.find(([, , to]) => typeof to?.left === "function");
		const result = call?.[2].left();
		expect(typeof result).toBe("number");
		expect(result).toBeGreaterThanOrEqual(24);
	});

	// ── Visibility gate — ScrollTrigger with onEnter/onLeave ─────────────────
	// The visibility gate requires both onEnter + onLeave + their *Back variants
	// to correctly show/hide for both forward and backward scrolling.
	it("creates a ScrollTrigger with onEnter for visibility reveal", () => {
		render(<Testimonials />);
		const call = mockScrollTriggerCreate.mock.calls.find(([config]) =>
			typeof config?.onEnter === "function"
		);
		expect(call).toBeDefined();
	});

	it("creates a ScrollTrigger with onLeave for visibility hide", () => {
		render(<Testimonials />);
		const call = mockScrollTriggerCreate.mock.calls.find(([config]) =>
			typeof config?.onLeave === "function"
		);
		expect(call).toBeDefined();
	});

	it("creates a ScrollTrigger with onEnterBack (backward scroll re-entry)", () => {
		render(<Testimonials />);
		const call = mockScrollTriggerCreate.mock.calls.find(([config]) =>
			typeof config?.onEnterBack === "function"
		);
		expect(call).toBeDefined();
	});

	it("creates a ScrollTrigger with onLeaveBack (backward scroll exit)", () => {
		render(<Testimonials />);
		const call = mockScrollTriggerCreate.mock.calls.find(([config]) =>
			typeof config?.onLeaveBack === "function"
		);
		expect(call).toBeDefined();
	});

	// ── Sanity: review card renders ──────────────────────────────────────────
	it("renders review cards from testimonials data", () => {
		render(<Testimonials />);
		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
	});
});
