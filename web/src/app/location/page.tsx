import LocationClient from "./location-client";

type LocationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LocationPage({ searchParams }: LocationPageProps) {
  const params = await searchParams;
  const returnTo = typeof params?.returnTo === "string" ? params.returnTo : "/";
  return <LocationClient initialReturnTo={returnTo} />;
}
