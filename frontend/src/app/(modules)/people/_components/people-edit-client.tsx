"use client";

import { useRouter } from "next/navigation";
import type { Person } from "../types";
import { PeopleRelationsForm } from "./people-relations-form";

export function PeopleEditClient({ person }: { person: Person }) {
  const router = useRouter();

  return (
    <PeopleRelationsForm
      initialValues={person}
      onSubmit={(values) => console.log(values)}
      onCancel={() => router.push(`/people/${person.id}`)}
    />
  );
}
