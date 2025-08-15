export type TargetingItem = {
  id?: string;
  key?: string;
  name: string;
  type?: string;
  topic?: string;
  audience_size?: number;
  path?: string[];
  relevance_score?: { score: number };
  audience?: { countries?: string[] };
  countries?: string[];
};

export function buildGeoTargeting(list: TargetingItem[]) {
  const countries = list
    .filter((x) => x.type === "country")
    .map((x) => (x as any).key || (x as any).name || (x as any).country_code);
  const regions = list
    .filter((x) => x.type === "region")
    .map((x) => ({ key: (x as any).key, name: x.name }));
  const cities = list
    .filter((x) => x.type === "city")
    .map((x) => ({ key: (x as any).key, name: x.name }));
  const zips = list
    .filter((x) => x.type === "zip")
    .map((x) => ({ key: (x as any).key, name: x.name }));
  return { geo_locations: { countries, regions, cities, zips } };
}

export function toTargetingJSON(activeTab: string, items: TargetingItem[], country: string) {
  if (activeTab === "geos") {
    return JSON.stringify(buildGeoTargeting(items), null, 2);
  }
  const bucketMap: Record<string, string> = {
    interests: "interests",
    behaviors: "behaviors",
    job_titles: "work_positions",
    employers: "work_employers",
    demographics: "life_events",
    life_events: "life_events",
    industries: "industries",
    geos: "geo_locations",
  };
  const bucket = bucketMap[activeTab] || "interests";
  return JSON.stringify(
    {
      geo_locations: { countries: [country] },
      flexible_spec: [
        {
          [bucket]: items.map((x) => ({ id: x.id, name: x.name })),
        },
      ],
    },
    null,
    2
  );
}
