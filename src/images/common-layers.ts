import {
    CodeOnIncusLayer,
    CopperflameMonoLayer,
    GhosttyLayer,
    IncusSleepLayer,
    KdeDarklyLayer,
    KdeRoundedCornersLayer,
    KlassyLayer,
    KWinEffectsBetterBlurDxLayer,
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
    new IncusSleepLayer(),
    new NixLayer(),
    new CopperflameMonoLayer(),
    new TerraLayer(),
    new VicinaeLayer(),
    new GhosttyLayer(),
];

export const kdeLayers = [
    new KdeDarklyLayer(),
    new KdeRoundedCornersLayer(),
    new KlassyLayer(),
    new KWinEffectsBetterBlurDxLayer(),
];

export const dxLayers = [new CodeOnIncusLayer()];
