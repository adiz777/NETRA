import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { NetworkNode, NetworkEdge } from '@shared/types/dossier.js';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  Building,
  Wallet,
  Car,
  Layers,
  X,
  Search,
  SlidersHorizontal,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface NetworkGraphViewProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  title?: string;
}

interface Point {
  x: number;
  y: number;
}

interface GraphNodeItem extends NetworkNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export const NetworkGraphView: React.FC<NetworkGraphViewProps> = ({
  nodes: inputNodes,
  edges: inputEdges,
  title = 'Relationship Network Graph',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({
    x: 0,
    y: 0,
    k: 1,
  });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Compute node positions (centralized layout with force relaxation)
  const [nodePositions, setNodePositions] = useState<Record<string, Point>>({});

  useEffect(() => {
    if (!inputNodes || inputNodes.length === 0) return;

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const positions: Record<string, Point> = {};
    const subject = inputNodes.find((n) => n.isSubject) || inputNodes[0];

    // Subject at center
    positions[subject.id] = { x: centerX, y: centerY };

    // Arrange other nodes in orbital rings based on count
    const nonSubjects = inputNodes.filter((n) => n.id !== subject.id);
    const count = nonSubjects.length;

    nonSubjects.forEach((node, index) => {
      // Ring radius depends on node count
      const radius = count > 8 && index % 2 === 1 ? 260 : 180;
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    setNodePositions(positions);
  }, [inputNodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return inputNodes.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = filterCategory === 'all' || node.category === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [inputNodes, searchQuery, filterCategory]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return inputEdges.filter(
      (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );
  }, [inputEdges, filteredNodeIds]);

  // Canvas pan / drag
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-bg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingCanvas) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    } else if (draggedNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
      const mouseY = (e.clientY - rect.top - transform.y) / transform.k;
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: mouseX, y: mouseY },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };

  const handleZoom = (delta: number) => {
    setTransform((prev) => {
      const nextK = Math.max(0.4, Math.min(2.5, prev.k + delta));
      return { ...prev, k: nextK };
    });
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  // Node Category Icon
  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'organization':
        return <Building className="w-3.5 h-3.5" />;
      case 'crypto_wallet':
        return <Wallet className="w-3.5 h-3.5" />;
      case 'vehicle':
        return <Car className="w-3.5 h-3.5" />;
      case 'shell_company':
        return <Layers className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  // Node Color based on risk score
  const getNodeColors = (risk: number, isSubject: boolean) => {
    if (isSubject) {
      return {
        fill: '#083344',
        stroke: '#00F0FF',
        glow: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))',
        badge: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50',
      };
    }
    if (risk >= 75) {
      return {
        fill: '#450a0a',
        stroke: '#EF4444',
        glow: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
        badge: 'text-rose-400 bg-rose-950/80 border-rose-500/50',
      };
    }
    if (risk >= 45) {
      return {
        fill: '#451a03',
        stroke: '#F59E0B',
        glow: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))',
        badge: 'text-amber-400 bg-amber-950/80 border-amber-500/50',
      };
    }
    return {
      fill: '#022c22',
      stroke: '#10B981',
      glow: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.3))',
      badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50',
    };
  };

  // Connected edges for the selected node inspector
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNode) return [];
    return inputEdges.filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id
    );
  }, [selectedNode, inputEdges]);

  return (
    <div className="relative glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex flex-col h-[600px] w-full">
      {/* Top Toolbar */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-tactical-mono text-sm font-semibold text-slate-100">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-tactical-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
            <span>NODES: {filteredNodes.length}</span>
            <span>•</span>
            <span>EDGES: {filteredEdges.length}</span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entity or role..."
              className="bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 w-44"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 font-tactical-mono"
          >
            <option value="all">ALL CATEGORIES</option>
            <option value="person">PERSONS</option>
            <option value="organization">ORGANIZATIONS</option>
            <option value="crypto_wallet">CRYPTO WALLETS</option>
            <option value="vehicle">VEHICLES</option>
            <option value="shell_company">SHELL ENTITIES</option>
          </select>

          {/* Controls: Zoom In, Zoom Out, Reset */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleZoom(0.15)}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Area */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-[#06080F] tactical-grid-bg cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <svg
          id="graph-bg"
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            {/* Arrow marker for directed edges */}
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="24"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#00F0FF" opacity="0.75" />
            </marker>
            <marker
              id="arrowhead-dormant"
              viewBox="0 0 10 10"
              refX="24"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748B" opacity="0.6" />
            </marker>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Edges */}
            {filteredEdges.map((edge) => {
              const src = nodePositions[edge.source];
              const tgt = nodePositions[edge.target];
              if (!src || !tgt) return null;

              const isConnectedToSelected =
                selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

              const strokeWidth = Math.max(1.5, edge.weight * 3.5);
              const strokeColor =
                edge.status === 'dormant' || edge.status === 'severed'
                  ? '#334155'
                  : isConnectedToSelected
                  ? '#00F0FF'
                  : '#1E293B';

              // Midpoint for edge label pill
              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={edge.status === 'monitored' ? '4,4' : undefined}
                    markerEnd={
                      edge.status === 'dormant' || edge.status === 'severed'
                        ? 'url(#arrowhead-dormant)'
                        : 'url(#arrowhead)'
                    }
                    className="transition-colors duration-200"
                  />
                  {/* Small edge type label */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-40"
                      y="-8"
                      width="80"
                      height="16"
                      rx="8"
                      fill="#0B0F19"
                      stroke={isConnectedToSelected ? '#00F0FF' : '#1E293B'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fill={isConnectedToSelected ? '#00F0FF' : '#94A3B8'}
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {edge.type.replace(/_/g, ' ').toUpperCase().slice(0, 12)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isSelected = selectedNode?.id === node.id;
              const colors = getNodeColors(node.riskScore, node.isSubject);
              const radius = node.isSubject ? 26 : 20;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer select-none"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNodeId(node.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                  }}
                >
                  {/* Halo pulse for selected / subject node */}
                  {(node.isSubject || isSelected) && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="1.5"
                      opacity="0.4"
                      className="animate-ping"
                      style={{ animationDuration: '3s' }}
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r={radius}
                    fill={colors.fill}
                    stroke={isSelected ? '#FFFFFF' : colors.stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    style={{ filter: colors.glow }}
                  />

                  {/* Inner Icon */}
                  <foreignObject
                    x={-radius}
                    y={-radius}
                    width={radius * 2}
                    height={radius * 2}
                    className="pointer-events-none"
                  >
                    <div className="w-full h-full flex items-center justify-center text-slate-100">
                      {getNodeIcon(node.category)}
                    </div>
                  </foreignObject>

                  {/* Label under node */}
                  <g transform={`translate(0, ${radius + 14})`}>
                    <rect
                      x={-Math.max(45, (node.label.length * 7) / 2)}
                      y="-9"
                      width={Math.max(90, node.label.length * 7)}
                      height="18"
                      rx="4"
                      fill="#070A0F"
                      stroke={colors.stroke}
                      strokeWidth="0.8"
                      opacity="0.9"
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fill="#F1F5F9"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="Inter, sans-serif"
                    >
                      {node.label}
                    </text>
                  </g>

                  {/* Role subtitle */}
                  <text
                    textAnchor="middle"
                    y={radius + 32}
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.role.slice(0, 18)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend / Overlay info */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-tactical-mono space-y-1.5 pointer-events-none">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Threat & Entity Legend
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              Subject
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Critical (≥75)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Medium (≥45)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Low
            </span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-0 right-0 w-80 h-full glass-panel-elevated border-l border-cyan-500/30 p-4 overflow-y-auto z-20 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="font-tactical-mono text-xs uppercase text-cyan-400 font-semibold tracking-wider">
                  Entity Profile
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400 font-tactical-mono">{selectedNode.role}</p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 text-xs font-tactical-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {selectedNode.category.toUpperCase()}
                </span>
                {selectedNode.isSubject && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                    TARGET SUBJECT
                  </span>
                )}
              </div>

              {/* Risk Score Gauge */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs font-tactical-mono">
                  <span className="text-slate-400">THREAT ASSESSMENT:</span>
                  <span
                    className={`font-bold ${
                      selectedNode.riskScore >= 75
                        ? 'text-rose-400'
                        : selectedNode.riskScore >= 45
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedNode.riskScore} / 100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedNode.riskScore >= 75
                        ? 'bg-rose-500'
                        : selectedNode.riskScore >= 45
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedNode.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Connected Relationships */}
              <div>
                <div className="text-xs font-tactical-mono uppercase text-slate-400 mb-2">
                  Direct Associations ({selectedNodeEdges.length})
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedNodeEdges.map((e) => {
                    const otherNodeId = e.source === selectedNode.id ? e.target : e.source;
                    const otherNode = inputNodes.find((n) => n.id === otherNodeId);
                    return (
                      <div
                        key={e.id}
                        className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">
                            {otherNode?.label || otherNodeId}
                          </span>
                          <span className="text-[10px] font-tactical-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {e.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-tactical-mono">
                          <span>Observed: {e.firstObserved}</span>
                          <span className="uppercase text-slate-400">Status: {e.status}</span>
                        </div>
                        {e.notes && (
                          <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800/60">
                            "{e.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
