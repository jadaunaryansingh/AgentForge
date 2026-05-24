import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export const EdgeAnimated: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Glowing background vector shadow */}
      <path
        id={`${id}-glow`}
        style={{
          stroke: '#818cf8',
          strokeWidth: 5,
          opacity: 0.1,
          fill: 'none',
        }}
        d={edgePath}
      />

      {/* Main core connector vector line */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#4f46e5',
          strokeWidth: 1.5,
          ...style,
        }}
      />

      {/* Pulsing light particle vector animation overlay */}
      <path
        style={{
          fill: 'none',
          stroke: '#e0e7ff',
          strokeWidth: 1.5,
          strokeDasharray: '6, 12',
          animation: 'dashdraw 1.5s linear infinite',
        }}
        d={edgePath}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#090514',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              border: '1px solid #312e81',
              color: '#a5b4fc',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
              pointerEvents: 'all',
              userSelect: 'none',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
export default EdgeAnimated;
