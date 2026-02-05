"use client";

import { useRouter } from "next/navigation";
import { PeopleRelationsForm } from "./people-relations-form";
export function PeopleCreateClient() {
  const router = useRouter();

  return (
    <PeopleRelationsForm
      onSubmit={(values) => console.log(values)}
      onCancel={() => router.push("/people")}
      submitLabel="Cadastrar"
    />
  );
}
