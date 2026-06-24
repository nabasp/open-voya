import * as React from "react";
import { useRouter } from "next/router";

// Landing route → always redirect to the dashboard.
export default function IndexPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
