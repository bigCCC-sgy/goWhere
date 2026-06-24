import GenerateClient from "./generate-client";

type GeneratePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = await searchParams;
  const mode = params?.mode === "idea" ? "idea" : "choose";
  return <GenerateClient initialMode={mode} />;
}
