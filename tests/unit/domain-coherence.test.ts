import { describe, it, expect } from "vitest";
import { generateIdentity } from "@generator/index.js";

describe("Dossier Cross-Domain & Chronological Coherence", () => {
  it("orders timeline events in non-descending chronological order", () => {
    const dossier = generateIdentity({ seed: "timeline-test" });
    const events = dossier.timeline.events;
    expect(events.length).toBeGreaterThan(1);

    for (let i = 1; i < events.length; i++) {
      const prevTime = new Date(events[i - 1].timestamp).getTime();
      const currTime = new Date(events[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it("anchors birth event to dateOfBirth", () => {
    const dossier = generateIdentity({ seed: "birth-test" });
    const birthEvent = dossier.timeline.events.find((e) => e.category === "birth");
    expect(birthEvent).toBeDefined();
    expect(birthEvent!.timestamp.startsWith(dossier.personal.dateOfBirth)).toBe(true);
  });

  it("ensures network graph edges connect to valid nodes and subject exists", () => {
    const dossier = generateIdentity({ seed: "graph-coherence-test" });
    const { nodes, edges } = dossier.networkGraph;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const subjectNode = nodes.find((n) => n.isSubject);

    expect(subjectNode).toBeDefined();

    for (const edge of edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
      expect(edge.weight).toBeGreaterThanOrEqual(0);
      expect(edge.weight).toBeLessThanOrEqual(1);
    }
  });

  it("ensures legalFullName is composed of firstName, middleName (if any), and lastName", () => {
    const dossier = generateIdentity({ seed: "name-coherence-test" });
    const { firstName, middleName, lastName, legalFullName } = dossier.personal;

    if (middleName) {
      expect(legalFullName).toBe(`${firstName} ${middleName} ${lastName}`);
    } else {
      expect(legalFullName).toBe(`${firstName} ${lastName}`);
    }
  });
});
