import type { ParamMatcher } from "@sveltejs/kit";
import { isAircraftSlug } from "$lib/aircraft";

export const match = isAircraftSlug satisfies ParamMatcher;
