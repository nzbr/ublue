import {
    CopperflameMonoLayer,
    GhosttyLayer,
    NixLayer,
    NoFlatpakAutoUpdateLayer,
    RpmOstreeTweaksLayer,
    SudoTweaksLayer,
    TerraLayer,
    VicinaeLayer,
} from "../layers";

export const commonLayers = [
    new RpmOstreeTweaksLayer(),
    new NoFlatpakAutoUpdateLayer(),
    new SudoTweaksLayer(),
    new NixLayer(),
    new CopperflameMonoLayer(),
    new TerraLayer(),
    new VicinaeLayer(),
    new GhosttyLayer(),
];
