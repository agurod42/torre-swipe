export type SearchFilter =
  | { keywords: { term: string; locale?: string } }
  | {
      language: {
        term: string;
        fluency: "basic" | "conversational" | "fully-fluent" | "native" | "fluent";
      };
    }
  | {
      "skill/role": {
        text: string;
        proficiency: "no-experience-required" | "beginner" | "proficient" | "expert";
      };
    }
  | { status: { code: "open" | "closed" | "paused" } };

export type SearchRequest = {
  and?: SearchFilter[];
  or?: SearchFilter[];
  not?: SearchFilter[];
};

export type SearchResponse = {
  total: number;
  size: number;
  results: Opportunity[];
};

export type Opportunity = {
  id: string;
  objective: string;
  slug: string;
  tagline: string;
  theme: string;
  type: "full-time-employment" | "part-time-employment" | "contractor" | "freelance";
  opportunity: "employee" | "freelancer";
  organizations: Organization[];
  locations: string[];
  timezones: string[] | null;
  remote: boolean;
  external: boolean;
  deadline: string | null;
  created: string;
  status: "open" | "closed" | "paused";
  commitment: "full-time" | "part-time";
  externalApplicationUrl: string | null;
  compensation: Compensation;
  skills: Skill[];
  place: Place;
};

export type Organization = {
  id: number;
  hashedId: string;
  name: string;
  status: string;
  size: number;
  publicId: string;
  picture: string;
  theme: string;
};

export type Compensation = {
  data: {
    code: "range" | "fixed";
    currency: string;
    minAmount: number;
    minHourlyUSD: number;
    maxAmount: number;
    maxHourlyUSD: number;
    periodicity: "hourly" | "monthly" | "yearly";
    negotiable: boolean;
    conversionRateUSD: number;
  };
  visible: boolean;
  additionalCompensationDetails: Record<string, unknown>;
};

export type Skill = {
  name: string;
  experience: "potential-to-develop" | "applying" | "leading";
  proficiency: "no-experience-required" | "beginner" | "proficient" | "expert";
};

export type Place = {
  remote: boolean;
  anywhere: boolean;
  timezone: boolean;
  locationType: "remote_countries" | "anywhere" | "timezone" | "onsite";
  location: Array<{
    id: string;
    timezone: number;
    countryCode: string | null;
    latitude: number;
    longitude: number;
  }>;
};
