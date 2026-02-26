import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { JobCard } from "../../components/JobCard";
import type { Opportunity, Organization, Compensation, Skill, Place } from "@torre-swipe/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src as string} alt={props.alt as string} />
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ get: () => 0 }),
  useTransform: () => ({ get: () => 0 }),
}));

const mockOrg: Organization = {
  id: 1, hashedId: "a", name: "Acme Corp", status: "active", size: 10,
  publicId: "acme", picture: "https://example.com/logo.png", theme: "#fff",
};
const mockComp: Compensation = {
  data: { code: "range", currency: "USD", minAmount: 120000, minHourlyUSD: 57,
    maxAmount: 160000, maxHourlyUSD: 76, periodicity: "yearly", negotiable: false, conversionRateUSD: 1 },
  visible: true, additionalCompensationDetails: {},
};
const mockPlace: Place = { remote: true, anywhere: true, timezone: false, locationType: "anywhere", location: [] };

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: "opp-1", objective: "Senior Engineer", slug: "senior-engineer",
    tagline: "Build great things", theme: "#000",
    type: "full-time-employment", opportunity: "employee",
    organizations: [mockOrg], locations: ["United States"], timezones: null,
    remote: true, external: false, deadline: null,
    created: "2024-01-01T00:00:00Z", status: "open", commitment: "full-time",
    externalApplicationUrl: "https://example.com/apply",
    compensation: mockComp,
    skills: [
      { name: "React", experience: "applying", proficiency: "proficient" },
      { name: "TypeScript", experience: "applying", proficiency: "proficient" },
      { name: "Node.js", experience: "applying", proficiency: "proficient" },
    ] as Skill[],
    place: mockPlace,
    ...overrides,
  };
}

describe("JobCard", () => {
  it("renders job title", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument();
  });

  it("renders company name", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders salary when visible", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText(/\$120k/)).toBeInTheDocument();
    expect(screen.getByText(/\$160k/)).toBeInTheDocument();
  });

  it("renders 'Salary not disclosed' when not visible", () => {
    const job = makeOpp({
      compensation: { ...mockComp, visible: false },
    });
    render(<JobCard job={job} />);
    expect(screen.getByText("Salary not disclosed")).toBeInTheDocument();
  });

  it("renders up to 3 skill chips", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("renders overflow +N chip when more than 3 skills", () => {
    const job = makeOpp({
      skills: [
        { name: "React", experience: "applying", proficiency: "proficient" },
        { name: "TypeScript", experience: "applying", proficiency: "proficient" },
        { name: "Node.js", experience: "applying", proficiency: "proficient" },
        { name: "GraphQL", experience: "applying", proficiency: "proficient" },
        { name: "Docker", experience: "applying", proficiency: "proficient" },
      ],
    });
    render(<JobCard job={job} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders remote badge when remote is true", () => {
    render(<JobCard job={makeOpp({ remote: true })} />);
    expect(screen.getByText("Remote")).toBeInTheDocument();
  });

  it("does not render remote badge when remote is false", () => {
    render(<JobCard job={makeOpp({ remote: false })} />);
    expect(screen.queryByText("Remote")).not.toBeInTheDocument();
  });

  it("shows fallback company name when no org", () => {
    render(<JobCard job={makeOpp({ organizations: [] })} />);
    expect(screen.getByText("Unknown Company")).toBeInTheDocument();
  });

  it("renders tagline", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText("Build great things")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<JobCard job={makeOpp()} />);
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<JobCard job={makeOpp()} />);
    expect(
      screen.getByRole("article", { name: "Senior Engineer at Acme Corp" }),
    ).toBeInTheDocument();
  });
});
