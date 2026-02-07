"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FamilyMember = {
  name: string;
  role: string;
  avatar: string;
};

export const FAMILY_PREVIEW: FamilyMember[] = [
  { name: "Maria Pereira", role: "Mae", avatar: "/avatar-female.jpg" },
  { name: "Joao Pereira", role: "Pai", avatar: "/avatar-male.jpg" },
];

export function FamilyPreview({ members }: { members: FamilyMember[] }) {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-4">
        {members.map((member) => (
          <div key={member.name} className="flex items-center gap-2">
            <div className="text-xs text-right">
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {member.role}
              </p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>
                {member.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ))}
      </div>
    </div>
  );
}
