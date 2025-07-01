import React from 'react';

interface EtiquetaStatusProps {
  texto: string;
  color?: string; // color de fondo principal
  textoColor?: string; // color del texto
  icono?: React.ReactNode;
  style?: React.CSSProperties;
}

// Estilo base: compacto, poco redondeado, discreto, elegante
const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 5,
  padding: '2px 10px',
  background: '#e6f4ea', // verde muy claro por default
  color: '#17803a', // verde oscuro por default
  border: '1px solid #b6e2c6',
  letterSpacing: 0.2,
  lineHeight: 1.2,
  minHeight: 22,
  userSelect: 'none',
};

export default function EtiquetaStatus({ texto, color, textoColor, icono, style }: EtiquetaStatusProps) {
  return (
    <span
      style={{
        ...baseStyle,
        background: color || baseStyle.background,
        color: textoColor || baseStyle.color,
        ...style,
      }}
    >
      {icono && <span style={{ fontSize: 15, marginRight: 4 }}>{icono}</span>}
      {texto}
    </span>
  );
}
