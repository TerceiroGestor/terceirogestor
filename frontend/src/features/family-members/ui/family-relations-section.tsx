"use client";

import { useFamilyRelationsContext } from "@/features/family-members/context/family-relations-context";
import { FamilyRelationsList } from "@/features/family-members/ui/family-relations-list";
export function FamilyRelationsSection() {
  const {
    data,
    isLoading,
    error,
    peopleOptions,
    incomeSummary,
    householdProfile,
    householdAssets,
    personAssetsByMember,
    refresh,
    create,
    update,
    remove,
  } = useFamilyRelationsContext();
  const incomeContributorIds = incomeSummary?.contributors ?? [];

  return (
    <div>
      <FamilyRelationsList
        peopleOptions={peopleOptions}
        relations={data?.relations ?? []}
        householdMembers={data?.householdMembers ?? []}
        incomeContributorIds={incomeContributorIds}
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
        onCreate={create}
        onUpdate={update}
        onDelete={remove}
        incomeSummary={incomeSummary}
        householdProfile={householdProfile}
        householdAssets={householdAssets}
        personAssetsByMember={personAssetsByMember}
      />
    </div>
  );
}
