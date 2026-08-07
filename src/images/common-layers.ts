import {
    CopperflameMonoLayer,
    NixLayer,
    NoFlatpakAutoUpdateLayer,
    RpmOstreeTweaksLayer,
    SudoTweaksLayer,
} from "../layers";

export const commonLayers = [
    new RpmOstreeTweaksLayer(),
    new NoFlatpakAutoUpdateLayer(),
    new SudoTweaksLayer(),
    new NixLayer(),
    new CopperflameMonoLayer(),
];
