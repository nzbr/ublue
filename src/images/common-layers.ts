import {
  CopperflameMonoLayer,
  NixMountpointLayer,
  NoFlatpakAutoUpdateLayer,
  RpmOstreeTweaksLayer,
  SudoTweaksLayer,
} from "../layers";

export const commonLayers = [
  new RpmOstreeTweaksLayer(),
  new NoFlatpakAutoUpdateLayer(),
  new SudoTweaksLayer(),
  new NixMountpointLayer(),
  new CopperflameMonoLayer(),
];
