import { createContext } from "svelte";
import type { Flight } from "./flight.svelte";
import type { RefId } from "./payload";

export type Companion = {
  flight: Flight;
  goToPhase(i: number): void;
  tickNext(): void;
  toggleTick(id: string): void;
  toggleRef(id: RefId): void;
  openRef(id: RefId): void;
  closeRef(): void;
  reset(): void;
};

export const [getCompanion, setCompanion] = createContext<Companion>();
