// region1.js — IF97 Region 1 (Compressed/Subcooled Liquid)

import { R, EPS } from "../constants.js";

/* IAPWS-IF97 Region 1 coefficients */
const I = [0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,8];
const J = [-2,-1,0,1,2,3,4,5,-9,-7,-1,0,1,3,-3,0,1,3,17,-4,0,6,-5,-2,10,-8,-11];
const n = [
  0.14632971213167,-0.84548187169114,-3.7563603672040,
  3.3855169168385,-0.95791963387872,0.15772038513228,
  -0.016616417199501,0.00081214629983568,
  0.00028319080123804,-0.00060706301565874,
  -0.018990068218419,-0.032529748770505,
  -0.021841717175414,-5.2838357969930e-05,
  -0.00047184321073267,-0.00030001780793026,
  0.000047661393906987,-4.4141845330846e-06,
  -7.2694996297594e-16,-3.1679644845054e-05,
  -2.8270797985312e-06,-8.5205128120103e-10,
  -2.2425281908000e-06,-6.5171222895601e-07,
  -1.4341729937924e-13,-4.0516996860117e-07,
  -1.2734301741641e-09
];

export function region1(T, P) {
  const pi = P / 16.53;
  const tau = 1386 / T;

  let g=0, gpi=0, gt=0, gpp=0, gtt=0, gpt=0;

  for (let k=0;k<n.length;k++){
    const dpi = 7.1 - pi;
    const dt = tau - 1.222;
    const dI = Math.pow(dpi, I[k]);
    const dJ = Math.pow(dt, J[k]);

    g += n[k]*dI*dJ;
    gpi -= n[k]*I[k]*Math.pow(dpi,I[k]-1)*dJ;
    gt += n[k]*J[k]*dI*Math.pow(dt,J[k]-1);
    gpp += n[k]*I[k]*(I[k]-1)*Math.pow(dpi,I[k]-2)*dJ;
    gtt += n[k]*J[k]*(J[k]-1)*dI*Math.pow(dt,J[k]-2);
    gpt -= n[k]*I[k]*J[k]*Math.pow(dpi,I[k]-1)*Math.pow(dt,J[k]-1);
  }

  const v = (R*T/P)*(-gpi);
  return {
    region:1,
    phase:"compressed_liquid",
    T,P,
    specificVolume:v,
    density:1/Math.max(v,EPS),
    enthalpy:R*T*tau*gt,
    entropy:R*(tau*gt-g),
    cp:-R*tau*tau*gtt,
    cv:R*(-tau*tau*gtt+Math.pow(gpi-tau*gpt,2)/Math.max(gpp,EPS))
  };
}
