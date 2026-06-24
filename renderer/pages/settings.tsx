import Head from "next/head";

import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>open voya — Settings</title>
      </Head>
      <h1 className="mb-5.5 text-xl font-bold tracking-tight">Settings</h1>
      <SettingsNav />
    </>
  );
}
