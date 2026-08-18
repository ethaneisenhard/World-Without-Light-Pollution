import { describe, expect, it } from "vitest";
import {
  FLEET_DONE_LINGER_MS,
  FLEET_GLOBAL_BAY,
  addFleetJob,
  createEmptyFleetRegistry,
  createFleetJob,
  emptyFleetBoardSnapshot,
  filterFleetJobs,
  fleetPetStateForJob,
  groupFleetJobsByProject,
  listFleetRecentJobs,
  listOfficeFloorJobs,
  mergeHostFleetBoardWithLocal,
  fleetBoardPaintKey,
  fleetBoardsPaintEqual,
  fleetJobWhenLabel,
  reconcileFleetJobsForOffice,
  toFleetBoardSnapshot,
  updateFleetJob,
  upsertJobOnFleetBoard,
} from "./fleet-job-pure.ts";
import {
  HARNESS_PET_DEFAULTS,
  resolveFleetPetId,
} from "./fleet-pet-registry-pure.ts";

describe("fleet-job-pure", () => {
  it("upserts and snapshots counts", () => {
    let reg = createEmptyFleetRegistry();
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "a",
        title: "Chat turn",
        projectId: "demo-blog",
        harnessId: "studio",
        modelId: "composer",
        source: "chat",
        status: "running",
        now: "2026-08-12T00:00:00.000Z",
      }),
    );
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "b",
        title: "Global ask",
        projectId: null,
        source: "chat",
        status: "queued",
        now: "2026-08-12T00:00:01.000Z",
      }),
    );
    const snap = toFleetBoardSnapshot(reg);
    expect(snap.running).toBe(1);
    expect(snap.queued).toBe(1);
    expect(snap.jobs).toHaveLength(2);
  });

  it("groups Global bay first", () => {
    const jobs = [
      createFleetJob({
        id: "p",
        title: "P",
        projectId: "zeta",
        now: "2026-08-12T00:00:00.000Z",
      }),
      createFleetJob({
        id: "g",
        title: "G",
        projectId: null,
        now: "2026-08-12T00:00:01.000Z",
      }),
      createFleetJob({
        id: "a",
        title: "A",
        projectId: "alpha",
        now: "2026-08-12T00:00:02.000Z",
      }),
    ];
    const bays = groupFleetJobsByProject(jobs);
    expect(bays[0]?.bayKey).toBe(FLEET_GLOBAL_BAY);
    expect(bays[0]?.label).toBe("Global");
    expect(bays.map((b) => b.bayKey)).toEqual([
      FLEET_GLOBAL_BAY,
      "alpha",
      "zeta",
    ]);
  });

  it("filters by harness and status", () => {
    const jobs = [
      createFleetJob({
        id: "1",
        title: "A",
        harnessId: "cursor",
        status: "running",
        now: "2026-08-12T00:00:00.000Z",
      }),
      createFleetJob({
        id: "2",
        title: "B",
        harnessId: "hermes",
        status: "running",
        now: "2026-08-12T00:00:01.000Z",
      }),
    ];
    expect(filterFleetJobs(jobs, { harnessId: "cursor" })).toHaveLength(1);
    expect(filterFleetJobs(jobs, { status: "queued" })).toHaveLength(0);
  });

  it("maps status to pet anim", () => {
    expect(fleetPetStateForJob({ status: "queued" })).toBe("waiting");
    expect(fleetPetStateForJob({ status: "running" })).toBe("running");
    expect(fleetPetStateForJob({ status: "blocked" })).toBe("failed");
    expect(
      fleetPetStateForJob({ status: "done", celebrating: true }),
    ).toBe("waving");
    expect(fleetPetStateForJob({ status: "cancelled" })).toBe("idle");
    expect(
      fleetPetStateForJob({ status: "running", selected: true }),
    ).toBe("review");
  });

  it("office floor keeps done within linger; recent after", () => {
    let reg = createEmptyFleetRegistry();
    const t0 = "2026-08-12T00:00:00.000Z";
    const tDone = "2026-08-12T00:00:10.000Z";
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "live",
        title: "Live",
        status: "running",
        now: t0,
      }),
    );
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "fresh",
        title: "Fresh done",
        status: "done",
        now: tDone,
      }),
    );
    reg = updateFleetJob(reg, "fresh", {
      status: "done",
      now: tDone,
    });
    const nowFresh = Date.parse(tDone) + 1_000;
    const floor = listOfficeFloorJobs(reg, { nowMs: nowFresh });
    expect(floor.map((j) => j.id).sort()).toEqual(["fresh", "live"]);

    const nowOld = Date.parse(tDone) + FLEET_DONE_LINGER_MS + 1;
    const floorOld = listOfficeFloorJobs(reg, { nowMs: nowOld });
    expect(floorOld.map((j) => j.id)).toEqual(["live"]);
    const recent = listFleetRecentJobs(reg, { nowMs: nowOld });
    expect(recent.map((j) => j.id)).toEqual(["fresh"]);
  });

  it("upsertJobOnFleetBoard + merge keeps fresh local running", () => {
    const local = upsertJobOnFleetBoard(
      emptyFleetBoardSnapshot(),
      createFleetJob({
        id: "chat:pending:s1",
        title: "lets test",
        status: "running",
        source: "chat",
        now: "2026-08-12T00:00:00.000Z",
      }),
    );
    const promoted = upsertJobOnFleetBoard(
      local,
      createFleetJob({
        id: "chat:t1",
        title: "lets test",
        status: "running",
        source: "chat",
        now: "2026-08-12T00:00:01.000Z",
      }),
      { replaceId: "chat:pending:s1" },
    );
    expect(promoted.jobs.map((j) => j.id)).toEqual(["chat:t1"]);
    const host = toFleetBoardSnapshot(createEmptyFleetRegistry());
    const merged = mergeHostFleetBoardWithLocal(host, promoted, {
      nowMs: Date.parse("2026-08-12T00:00:10.000Z"),
    });
    expect(merged.jobs).toHaveLength(1);
    expect(merged.jobs[0]?.id).toBe("chat:t1");
  });

  it("merge drops stale local-only running desks", () => {
    const local = upsertJobOnFleetBoard(
      emptyFleetBoardSnapshot(),
      createFleetJob({
        id: "chat:zombie",
        title: "Did ya finish?",
        status: "running",
        source: "chat",
        now: "2026-08-12T00:00:00.000Z",
      }),
    );
    const host = toFleetBoardSnapshot(createEmptyFleetRegistry());
    const merged = mergeHostFleetBoardWithLocal(host, local, {
      nowMs: Date.parse("2026-08-12T00:05:00.000Z"),
    });
    expect(merged.jobs).toHaveLength(0);
  });

  it("reconcile seals stale running and collapses one chat per session", () => {
    let reg = createEmptyFleetRegistry();
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "chat:old",
        title: "old turn",
        status: "running",
        source: "chat",
        sessionId: "s1",
        now: "2026-08-12T00:00:00.000Z",
      }),
    );
    reg = addFleetJob(
      reg,
      createFleetJob({
        id: "chat:new",
        title: "follow up",
        status: "running",
        source: "chat",
        sessionId: "s1",
        now: "2026-08-12T00:00:20.000Z",
      }),
    );
    const nowFresh = Date.parse("2026-08-12T00:00:30.000Z");
    const collapsed = reconcileFleetJobsForOffice(reg.jobs, { nowMs: nowFresh });
    expect(collapsed.find((j) => j.id === "chat:new")?.status).toBe("running");
    expect(collapsed.find((j) => j.id === "chat:old")?.status).toBe("cancelled");

    const nowStale = Date.parse("2026-08-12T00:20:00.000Z");
    const sealed = reconcileFleetJobsForOffice(reg.jobs, { nowMs: nowStale });
    expect(sealed.every((j) => j.status === "cancelled")).toBe(true);
    const floor = listOfficeFloorJobs(
      { jobs: sealed },
      { nowMs: nowStale },
    );
    expect(floor).toHaveLength(0);
    const recent = listFleetRecentJobs({ jobs: sealed }, { nowMs: nowStale });
    expect(recent.map((j) => j.id).sort()).toEqual(["chat:new", "chat:old"]);
  });

  it("fleetBoardPaintKey ignores job order", () => {
    const a = createFleetJob({
      id: "a",
      title: "A",
      status: "done",
      source: "spawn",
      now: "2026-08-12T00:00:00.000Z",
    });
    const b = createFleetJob({
      id: "b",
      title: "B",
      status: "blocked",
      source: "chat",
      now: "2026-08-12T00:00:01.000Z",
    });
    const left = toFleetBoardSnapshot({ jobs: [a, b] });
    const right = toFleetBoardSnapshot({ jobs: [b, a] });
    expect(fleetBoardsPaintEqual(left, right)).toBe(true);
    expect(fleetBoardPaintKey(left)).toBe(fleetBoardPaintKey(right));
    const changed = toFleetBoardSnapshot({
      jobs: [{ ...b, statusLine: "Ready" }],
    });
    expect(fleetBoardsPaintEqual(left, changed)).toBe(false);
  });

  it("fleetJobWhenLabel uses minutes then hours", () => {
    const t0 = Date.parse("2026-08-12T12:00:00.000Z");
    expect(fleetJobWhenLabel("2026-08-12T12:00:10.000Z", t0)).toBe("just now");
    expect(fleetJobWhenLabel("2026-08-12T11:50:00.000Z", t0)).toBe("10m ago");
    expect(fleetJobWhenLabel("2026-08-12T09:00:00.000Z", t0)).toBe("3h ago");
  });
});

describe("fleet-pet-registry-pure", () => {
  it("resolves harness default then override then random", () => {
    expect(resolveFleetPetId({ harnessId: "cursor" })).toBe(
      HARNESS_PET_DEFAULTS.cursor,
    );
    expect(
      resolveFleetPetId({
        harnessId: "cursor",
        harnessPets: { cursor: "custom-pet" },
      }),
    ).toBe("custom-pet");
    expect(
      resolveFleetPetId({
        harnessId: "unknown-x",
        random: () => 0,
      }),
    ).toBeTruthy();
    expect(
      resolveFleetPetId({ harnessId: "studio", petId: "explicit" }),
    ).toBe("explicit");
  });
});
