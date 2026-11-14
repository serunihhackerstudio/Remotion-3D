import React from "react";
import {SceneProps} from "../timing";
import {S1, S2, S3, S4, S5, S6, S7, S8} from "./all";

export const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7, s8: S8};
