"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plane, Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DateRange } from "react-day-picker";

const timelineEvents = [
  {
    time: "09:00",
    title: "Kickoff sprint planning",
    detail: "Product + Design",
    icon: Users,
  },
  {
    time: "11:30",
    title: "Stakeholder sync",
    detail: "Leadership",
    icon: CalendarIcon,
  },
  {
    time: "14:00",
    title: "Launch review",
    detail: "Growth squad",
    icon: Plane,
  },
  {
    time: "16:30",
    title: "1:1s",
    detail: "People ops",
    icon: Clock,
  },
];

const timeOffRequests = [
  {
    name: "Ana Costa",
    period: "Mar 10 - Mar 14",
    status: "Pending",
  },
  {
    name: "Rafa Moreira",
    period: "Apr 2 - Apr 3",
    status: "Approved",
  },
  {
    name: "Camila Santos",
    period: "Apr 18 - Apr 22",
    status: "Pending",
  },
];

export default function CalendarPage() {
  const [selected, setSelected] = React.useState<Date | undefined>(new Date());
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  return (
    <div className="flex flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Calendar
          </p>
          <h1 className="text-2xl font-semibold">Team schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Sync calendars</Button>
          <Button>New event</Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly view</CardTitle>
            <CardDescription>
              Overview of the month with selected focus day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={setSelected}
                className="rounded-lg border"
              />
              <div className="flex-1 space-y-4">
                <div className="rounded-xl border border-border bg-card px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Selected day
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {selected ? format(selected, "EEEE, MMM d") : "None"}
                  </p>
                </div>
                <div className="space-y-3">
                  {timelineEvents.slice(0, 2).map((event) => {
                    const Icon = event.icon;
                    return (
                      <div
                        key={event.title}
                        className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
                      >
                        <div className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.time} · {event.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time-off requests</CardTitle>
            <CardDescription>Pending approvals for this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeOffRequests.map((request) => (
              <div
                key={request.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{request.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.period}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {request.status}
                </span>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Review requests
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Daily agenda with time markers.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={event.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                        <Icon className="size-4" />
                      </div>
                      {index < timelineEvents.length - 1 ? (
                        <div className="mt-2 h-full w-px bg-border" />
                      ) : null}
                    </div>
                    <div className="flex-1 rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {event.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time-off calendar</CardTitle>
            <CardDescription>
              Select a range for team time-off tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              className="rounded-lg border"
            />
            <Separator className="my-4" />
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Selected range
              </p>
              <p className="mt-2 text-sm font-semibold">
                {range?.from ? format(range.from, "MMM dd, yyyy") : "--"}
                {range?.to ? ` - ${format(range.to, "MMM dd, yyyy")}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly capacity</CardTitle>
            <CardDescription>Hours allocated per team.</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer>
              <BarChart
                data={timelineEvents.map((event, index) => ({
                  name: event.title.split(" ")[0],
                  hours: 2 + index * 1.5,
                }))}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Bar dataKey="hours" fill="var(--color-chart-2)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Manage calendars faster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Create event",
              "Approve time-off",
              "Share schedule",
              "Assign shifts",
            ].map((action) => (
              <Button key={action} variant="outline" className="w-full">
                {action}
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
