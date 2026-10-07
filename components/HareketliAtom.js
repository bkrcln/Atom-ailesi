const YORUNGELER = [
  { rx: 172, ry: 54, aci: -14, sure: '7s' },
  { rx: 112, ry: 38, aci: 42, sure: '4.2s' },
  { rx: 112, ry: 38, aci: -48, sure: '4.8s' }
];

const CEKIRDEK = [
  [200, 150, '#4D8BFF'], [182, 140, '#FF5A6E'], [218, 139, '#4D8BFF'], [222, 160, '#FF5A6E'],
  [200, 168, '#4D8BFF'], [179, 162, '#FF5A6E'], [200, 131, '#4D8BFF']
];

function Yuz({ x = 0, y = 0, r }) {
  return (
    <g>
      <circle cx={x - r * .34} cy={y - r * .1} r={r * .2} fill="#fff" />
      <circle cx={x + r * .34} cy={y - r * .1} r={r * .2} fill="#fff" />
      <circle cx={x - r * .34} cy={y - r * .07} r={r * .11} fill="#1A1D47" />
      <circle cx={x + r * .34} cy={y - r * .07} r={r * .11} fill="#1A1D47" />
      <path d={`M ${x - r * .24} ${y + r * .2} Q ${x} ${y + r * .45} ${x + r * .24} ${y + r * .2}`} fill="none" stroke="#1A1D47" strokeWidth={r * .08} strokeLinecap="round" />
    </g>
  );
}

export default function HareketliAtom() {
  return (
    <svg className="hero-atom" viewBox="0 0 400 300" role="img" aria-label="Çekirdeğin çevresinde dönen elektronlarla gülümseyen bir atom">
      {YORUNGELER.map((y, i) => {
        const yol = `M ${-y.rx} 0 A ${y.rx} ${y.ry} 0 1 0 ${y.rx} 0 A ${y.rx} ${y.ry} 0 1 0 ${-y.rx} 0`;
        return (
          <g key={i} transform={`translate(200 150) rotate(${y.aci})`}>
            <path className="hero-yorunge" d={yol} />
            <g className="hareketli">
              <g>
                <circle r="11" fill="#FFD23F" stroke="#fff" strokeWidth="2" />
                <Yuz r={11} />
                <animateMotion dur={y.sure} repeatCount="indefinite" path={yol} begin={`-${i * 1.3}s`} />
              </g>
            </g>
            <g className="sabit" transform={`translate(${y.rx} 0)`}>
              <circle r="11" fill="#FFD23F" stroke="#fff" strokeWidth="2" />
              <Yuz r={11} />
            </g>
          </g>
        );
      })}
      {CEKIRDEK.map(([x, y, renk], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill={renk} stroke="#fff" strokeWidth="2.2" />
          <Yuz x={x} y={y} r={17} />
        </g>
      ))}
    </svg>
  );
}
