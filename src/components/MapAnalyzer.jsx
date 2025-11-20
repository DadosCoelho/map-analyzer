import React, { useState, useRef, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, Info, Grid, Eye, RotateCcw, Search, Filter, Download, Plus, Trash2, Save, Settings, Play } from 'lucide-react';

const MapAnalyzer = () => {
  const [mapData, setMapData] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [filterElement, setFilterElement] = useState('all');
  const [searchPosition, setSearchPosition] = useState({ x: '', y: '' });
  const [cellSize, setCellSize] = useState(16);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('dimensions');
  
  // Configuração padrão do mapa
  const [mapConfig, setMapConfig] = useState({
    dimensions: { width: 50, height: 30 },
    barriers: [
      { type: 'perimeter', symbol: '#' }
    ],
    elements: [],
    restrictions: []
  });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Cores para diferentes elementos
  const elementColors = {
    '#': '#4a5568', '█': '#2d3748', '▓': '#4a5568', '■': '#1a202c', '▒': '#718096',
    '~': '#4299e1', '│': '#4a5568', '─': '#4a5568', 'P': '#48bb78', '@': '#48bb78',
    'E': '#f56565', 'M': '#e53e3e', 'X': '#e53e3e', '$': '#ecc94b', '◊': '#ecc94b',
    '♦': '#d69e2e', 'T': '#ed8936', 'H': '#9ae6b4', '+': '#9ae6b4', '⌂': '#805ad5',
    '♣': '#38a169', '♠': '#2f855a', 'Ω': '#e53e3e', '*': '#fbd38d', '!': '#fc8181',
    'A': '#667eea', 'B': '#f687b3',
  };

  // Salvar configuração no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mapConfig');
    if (saved) {
      setMapConfig(JSON.parse(saved));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('mapConfig', JSON.stringify(mapConfig));
    alert('✓ Configuração salva como padrão!');
  };

  // Processar arquivo carregado
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim());
      
      const grid = lines.map(line => line.split(''));
      const stats = calculateStatistics(grid);
      
      setMapData({
        grid,
        width: Math.max(...grid.map(row => row.length)),
        height: grid.length
      });
      setStatistics(stats);
      resetView();
    };
    reader.readAsText(file);
  };

  // Gerar mapa baseado na configuração
  const generateMap = () => {
    const { dimensions, barriers, elements, restrictions } = mapConfig;
    const grid = Array(dimensions.height).fill(null).map(() => 
      Array(dimensions.width).fill('.')
    );

    // Função auxiliar para colocar elemento
    const place = (x, y, symbol) => {
      if (x >= 0 && x < dimensions.width && y >= 0 && y < dimensions.height) {
        grid[y][x] = symbol;
      }
    };

    // Gerar barreiras
    barriers.forEach(barrier => {
      if (barrier.type === 'perimeter') {
        for (let x = 0; x < dimensions.width; x++) {
          place(x, 0, barrier.symbol);
          place(x, dimensions.height - 1, barrier.symbol);
        }
        for (let y = 0; y < dimensions.height; y++) {
          place(0, y, barrier.symbol);
          place(dimensions.width - 1, y, barrier.symbol);
        }
      } else if (barrier.type === 'random') {
        for (let i = 0; i < barrier.count; i++) {
          const x = Math.floor(Math.random() * dimensions.width);
          const y = Math.floor(Math.random() * dimensions.height);
          if (grid[y][x] === '.') place(x, y, barrier.symbol);
        }
      } else if (barrier.type === 'line') {
        const { start, end } = barrier;
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const sx = start.x < end.x ? 1 : -1;
        const sy = start.y < end.y ? 1 : -1;
        let err = dx - dy;
        let x = start.x, y = start.y;

        while (true) {
          place(x, y, barrier.symbol);
          if (x === end.x && y === end.y) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x += sx; }
          if (e2 < dx) { err += dx; y += sy; }
        }
      } else if (barrier.type === 'rectangle') {
        for (let i = 0; i < barrier.width; i++) {
          for (let j = 0; j < barrier.height; j++) {
            if (barrier.filled || i === 0 || i === barrier.width - 1 || j === 0 || j === barrier.height - 1) {
              place(barrier.x + i, barrier.y + j, barrier.symbol);
            }
          }
        }
      }
    });

    // Gerar elementos
    elements.forEach(element => {
      let placed = 0;
      let attempts = 0;
      while (placed < element.count && attempts < element.count * 20) {
        const x = Math.floor(Math.random() * dimensions.width);
        const y = Math.floor(Math.random() * dimensions.height);
        
        if (grid[y][x] === '.') {
          // Verificar restrições
          let canPlace = true;
          restrictions.forEach(restriction => {
            if (restriction.element === element.symbol) {
              const minDist = restriction.min_distance || 1;
              for (let dx = -minDist; dx <= minDist; dx++) {
                for (let dy = -minDist; dy <= minDist; dy++) {
                  const nx = x + dx, ny = y + dy;
                  if (nx >= 0 && nx < dimensions.width && ny >= 0 && ny < dimensions.height) {
                    if (restriction.cannot_touch.includes(grid[ny][nx])) {
                      canPlace = false;
                    }
                  }
                }
              }
            }
          });
          
          if (canPlace) {
            place(x, y, element.symbol);
            placed++;
          }
        }
        attempts++;
      }
    });

    const stats = calculateStatistics(grid);
    setMapData({ grid, width: dimensions.width, height: dimensions.height });
    setStatistics(stats);
    resetView();
    setShowCreateMenu(false);
  };

  // Calcular estatísticas
  const calculateStatistics = (grid) => {
    const stats = {};
    let total = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell && cell !== '.' && cell !== ' ') {
          stats[cell] = (stats[cell] || 0) + 1;
          total++;
        }
      });
    });
    
    return { elements: stats, total, empty: (grid.length * grid[0]?.length || 0) - total };
  };

  // Adicionar barreira
  const addBarrier = () => {
    setMapConfig({
      ...mapConfig,
      barriers: [...mapConfig.barriers, { type: 'random', symbol: '#', count: 10 }]
    });
  };

  // Remover barreira
  const removeBarrier = (index) => {
    setMapConfig({
      ...mapConfig,
      barriers: mapConfig.barriers.filter((_, i) => i !== index)
    });
  };

  // Atualizar barreira
  const updateBarrier = (index, field, value) => {
    const newBarriers = [...mapConfig.barriers];
    newBarriers[index] = { ...newBarriers[index], [field]: value };
    setMapConfig({ ...mapConfig, barriers: newBarriers });
  };

  // Adicionar elemento
  const addElement = () => {
    setMapConfig({
      ...mapConfig,
      elements: [...mapConfig.elements, { symbol: 'X', count: 5, placement: 'random' }]
    });
  };

  // Remover elemento
  const removeElement = (index) => {
    setMapConfig({
      ...mapConfig,
      elements: mapConfig.elements.filter((_, i) => i !== index)
    });
  };

  // Atualizar elemento
  const updateElement = (index, field, value) => {
    const newElements = [...mapConfig.elements];
    newElements[index] = { ...newElements[index], [field]: value };
    setMapConfig({ ...mapConfig, elements: newElements });
  };

  // Adicionar restrição
  const addRestriction = () => {
    setMapConfig({
      ...mapConfig,
      restrictions: [...mapConfig.restrictions, { element: 'X', cannot_touch: ['#'], min_distance: 1 }]
    });
  };

  // Remover restrição
  const removeRestriction = (index) => {
    setMapConfig({
      ...mapConfig,
      restrictions: mapConfig.restrictions.filter((_, i) => i !== index)
    });
  };

  // Atualizar restrição
  const updateRestriction = (index, field, value) => {
    const newRestrictions = [...mapConfig.restrictions];
    if (field === 'cannot_touch') {
      newRestrictions[index][field] = value.split(',').map(s => s.trim()).filter(s => s);
    } else {
      newRestrictions[index][field] = value;
    }
    setMapConfig({ ...mapConfig, restrictions: newRestrictions });
  };

  // Exportar configuração
  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(mapConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map_config.json';
    a.click();
  };

  // Importar configuração
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setMapConfig(config);
        alert('✓ Configuração importada!');
      } catch (error) {
        alert('✗ Erro ao importar configuração');
      }
    };
    reader.readAsText(file);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFilterElement('all');
    setSelectedElement(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) {
      if (mapData && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / (cellSize * zoom);
        const y = (e.clientY - rect.top - pan.y) / (cellSize * zoom);
        
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        
        if (gridX >= 0 && gridX < mapData.width && gridY >= 0 && gridY < mapData.height) {
          setHoveredCell({ x: gridX, y: gridY, value: mapData.grid[gridY]?.[gridX] });
        } else {
          setHoveredCell(null);
        }
      }
      return;
    }
    
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSearchPosition = () => {
    const x = parseInt(searchPosition.x);
    const y = parseInt(searchPosition.y);
    
    if (isNaN(x) || isNaN(y) || !mapData) return;
    
    if (x >= 0 && x < mapData.width && y >= 0 && y < mapData.height) {
      const canvas = canvasRef.current;
      if (canvas) {
        setPan({
          x: canvas.width / 2 - x * cellSize * zoom,
          y: canvas.height / 2 - y * cellSize * zoom
        });
        setSelectedElement({ x, y, value: mapData.grid[y][x] });
      }
    }
  };

  const exportAnalysis = () => {
    const data = {
      dimensions: { width: mapData.width, height: mapData.height },
      statistics,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map_analysis.json';
    a.click();
  };

  // Renderizar mapa no canvas
  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const cell = mapData.grid[y]?.[x];
        
        if (!cell || cell === '.' || cell === ' ') continue;
        
        if (filterElement !== 'all' && cell !== filterElement) continue;

        const color = elementColors[cell] || '#a0aec0';
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        if (showGrid && zoom > 0.5) {
          ctx.strokeStyle = '#2d3748';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }

        if (zoom > 1.5) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `${cellSize * 0.7}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
        }
      }
    }

    if (selectedElement) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(
        selectedElement.x * cellSize,
        selectedElement.y * cellSize,
        cellSize,
        cellSize
      );
    }

    if (hoveredCell && zoom > 0.5) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(
        hoveredCell.x * cellSize,
        hoveredCell.y * cellSize,
        cellSize,
        cellSize
      );
    }

    ctx.restore();
  }, [mapData, zoom, pan, showGrid, filterElement, selectedElement, hoveredCell, cellSize]);

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold mb-3">🗺️ Gerador e Analisador de Mapas 2D</h1>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
          >
            <Settings size={18} />
            <span>Criar Mapa</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer transition">
            <Upload size={18} />
            <span>Carregar Mapa</span>
            <input type="file" accept=".txt,.map" onChange={handleFileUpload} className="hidden" />
          </label>

          <button onClick={handleZoomOut} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
            <ZoomOut size={18} />
          </button>
          <div className="px-4 py-2 bg-gray-700 rounded min-w-[100px] text-center">
            {(zoom * 100).toFixed(0)}%
          </div>
          <button onClick={handleZoomIn} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
            <ZoomIn size={18} />
          </button>

          <select 
            value={cellSize} 
            onChange={(e) => setCellSize(Number(e.target.value))}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            <option value={8}>8px</option>
            <option value={12}>12px</option>
            <option value={16}>16px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
          </select>

          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 rounded transition ${showGrid ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Grid size={18} />
          </button>

          <button onClick={resetView} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition">
            <RotateCcw size={18} />
          </button>

          {mapData && (
            <button onClick={exportAnalysis} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition flex items-center gap-2">
              <Download size={18} />
              <span>Exportar</span>
            </button>
          )}
        </div>

        {mapData && (
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              placeholder="X"
              value={searchPosition.x}
              onChange={(e) => setSearchPosition({...searchPosition, x: e.target.value})}
              className="w-20 px-2 py-1 bg-gray-700 rounded"
            />
            <input
              type="number"
              placeholder="Y"
              value={searchPosition.y}
              onChange={(e) => setSearchPosition({...searchPosition, y: e.target.value})}
              className="w-20 px-2 py-1 bg-gray-700 rounded"
            />
            <button onClick={handleSearchPosition} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2">
              <Search size={16} />
              Ir
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas do Mapa */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="w-full h-full" />
          
          {!mapData && !showCreateMenu && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Settings size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl">Crie ou carregue um mapa para começar</p>
                <p className="text-sm mt-2">Use o botão "Criar Mapa" para configurar um novo mapa</p>
              </div>
            </div>
          )}

          {hoveredCell && (
            <div className="absolute top-4 left-4 bg-gray-800 px-3 py-2 rounded shadow-lg border border-gray-700">
              <div className="text-sm">
                <div>Posição: ({hoveredCell.x}, {hoveredCell.y})</div>
                <div>Elemento: <span className="font-bold">{hoveredCell.value || 'vazio'}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Menu de Criação */}
        {showCreateMenu && (
          <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Configuração do Mapa</h2>
                <button onClick={() => setShowCreateMenu(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-700">
                <button 
                  onClick={() => setActiveTab('dimensions')}
                  className={`px-3 py-2 ${activeTab === 'dimensions' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                >
                  Dimensões
                </button>
                <button 
                  onClick={() => setActiveTab('barriers')}
                  className={`px-3 py-2 ${activeTab === 'barriers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                >
                  Barreiras
                </button>
                <button 
                  onClick={() => setActiveTab('elements')}
                  className={`px-3 py-2 ${activeTab === 'elements' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                >
                  Elementos
                </button>
                <button 
                  onClick={() => setActiveTab('restrictions')}
                  className={`px-3 py-2 ${activeTab === 'restrictions' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'}`}
                >
                  Restrições
                </button>
              </div>

              {/* Dimensões */}
              {activeTab === 'dimensions' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">Largura</label>
                    <input
                      type="number"
                      value={mapConfig.dimensions.width}
                      onChange={(e) => setMapConfig({
                        ...mapConfig,
                        dimensions: { ...mapConfig.dimensions, width: parseInt(e.target.value) || 50 }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Altura</label>
                    <input
                      type="number"
                      value={mapConfig.dimensions.height}
                      onChange={(e) => setMapConfig({
                        ...mapConfig,
                        dimensions: { ...mapConfig.dimensions, height: parseInt(e.target.value) || 30 }
                      })}
                      className="w-full px-3 py-2 bg-gray-700 rounded"
                    />
                  </div>
                </div>
              )}

              {/* Barreiras */}
              {activeTab === 'barriers' && (
                <div className="space-y-4">
                  <button onClick={addBarrier} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Adicionar Barreira
                  </button>
                  
                  {mapConfig.barriers.map((barrier, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Barreira {index + 1}</span>
                        <button onClick={() => removeBarrier(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <select
                        value={barrier.type}
                        onChange={(e) => updateBarrier(index, 'type', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                      >
                        <option value="perimeter">Perímetro</option>
                        <option value="random">Aleatório</option>
                        <option value="line">Linha</option>
                        <option value="rectangle">Retângulo</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Símbolo"
                        value={barrier.symbol}
                        onChange={(e) => updateBarrier(index, 'symbol', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                        maxLength={1}
                      />

                      {barrier.type === 'random' && (
                        <input
                          type="number"
                          placeholder="Quantidade"
                          value={barrier.count || 10}
                          onChange={(e) => updateBarrier(index, 'count', parseInt(e.target.value) || 10)}
                          className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                        />
                      )}

                      {barrier.type === 'line' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Start X"
                              value={barrier.start?.x || 0}
                              onChange={(e) => updateBarrier(index, 'start', { ...barrier.start, x: parseInt(e.target.value) || 0 })}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Start Y"
                              value={barrier.start?.y || 0}
                              onChange={(e) => updateBarrier(index, 'start', { ...barrier.start, y: parseInt(e.target.value) || 0 })}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="End X"
                              value={barrier.end?.x || 10}
                              onChange={(e) => updateBarrier(index, 'end', { ...barrier.end, x: parseInt(e.target.value) || 10 })}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="End Y"
                              value={barrier.end?.y || 10}
                              onChange={(e) => updateBarrier(index, 'end', { ...barrier.end, y: parseInt(e.target.value) || 10 })}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                          </div>
                        </>
                      )}

                      {barrier.type === 'rectangle' && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="X"
                              value={barrier.x || 5}
                              onChange={(e) => updateBarrier(index, 'x', parseInt(e.target.value) || 5)}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Y"
                              value={barrier.y || 5}
                              onChange={(e) => updateBarrier(index, 'y', parseInt(e.target.value) || 5)}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Largura"
                              value={barrier.width || 10}
                              onChange={(e) => updateBarrier(index, 'width', parseInt(e.target.value) || 10)}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Altura"
                              value={barrier.height || 10}
                              onChange={(e) => updateBarrier(index, 'height', parseInt(e.target.value) || 10)}
                              className="px-2 py-1 bg-gray-600 rounded text-sm"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={barrier.filled || false}
                              onChange={(e) => updateBarrier(index, 'filled', e.target.checked)}
                              className="rounded"
                            />
                            Preenchido
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Elementos */}
              {activeTab === 'elements' && (
                <div className="space-y-4">
                  <button onClick={addElement} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Adicionar Elemento
                  </button>
                  
                  {mapConfig.elements.map((element, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Elemento {index + 1}</span>
                        <button onClick={() => removeElement(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Símbolo"
                        value={element.symbol}
                        onChange={(e) => updateElement(index, 'symbol', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                        maxLength={1}
                      />

                      <input
                        type="number"
                        placeholder="Quantidade"
                        value={element.count}
                        onChange={(e) => updateElement(index, 'count', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                      />

                      <select
                        value={element.placement}
                        onChange={(e) => updateElement(index, 'placement', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                      >
                        <option value="random">Aleatório</option>
                        <option value="clustered">Agrupado</option>
                        <option value="scattered">Espalhado</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Restrições */}
              {activeTab === 'restrictions' && (
                <div className="space-y-4">
                  <button onClick={addRestriction} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Adicionar Restrição
                  </button>
                  
                  {mapConfig.restrictions.map((restriction, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Restrição {index + 1}</span>
                        <button onClick={() => removeRestriction(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Elemento"
                        value={restriction.element}
                        onChange={(e) => updateRestriction(index, 'element', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                        maxLength={1}
                      />

                      <input
                        type="text"
                        placeholder="Não pode tocar (separados por vírgula)"
                        value={restriction.cannot_touch?.join(', ') || ''}
                        onChange={(e) => updateRestriction(index, 'cannot_touch', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                      />

                      <input
                        type="number"
                        placeholder="Distância mínima"
                        value={restriction.min_distance}
                        onChange={(e) => updateRestriction(index, 'min_distance', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-gray-600 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="mt-6 space-y-2">
                <button 
                  onClick={generateMap}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Gerar Mapa
                </button>

                <button 
                  onClick={saveConfig}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar como Padrão
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={exportConfig}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Exportar Config
                  </button>

                  <label className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={16} />
                    Importar Config
                    <input type="file" accept=".json" onChange={importConfig} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Painel Lateral de Análise */}
        {mapData && !showCreateMenu && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            {/* Informações do Mapa */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Info size={20} />
                Informações
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Largura:</span>
                  <span className="font-mono">{mapData.width}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Altura:</span>
                  <span className="font-mono">{mapData.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Células:</span>
                  <span className="font-mono">{mapData.width * mapData.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ocupadas:</span>
                  <span className="font-mono">{statistics.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vazias:</span>
                  <span className="font-mono">{statistics.empty}</span>
                </div>
              </div>
            </div>

            {/* Filtro de Elementos */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Filter size={20} />
                Filtrar
              </h2>
              <select
                value={filterElement}
                onChange={(e) => setFilterElement(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              >
                <option value="all">Todos os elementos</option>
                {Object.keys(statistics.elements || {}).map(element => (
                  <option key={element} value={element}>{element}</option>
                ))}
              </select>
            </div>

            {/* Estatísticas dos Elementos */}
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Eye size={20} />
                Elementos
              </h2>
              <div className="space-y-2">
                {Object.entries(statistics.elements || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([element, count]) => {
                    const percentage = ((count / statistics.total) * 100).toFixed(1);
                    return (
                      <div key={element} className="bg-gray-700 p-3 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center font-mono text-sm"
                              style={{ backgroundColor: elementColors[element] || '#a0aec0' }}
                            >
                              {element}
                            </div>
                            <span className="font-mono">{element}</span>
                          </div>
                          <span className="text-gray-400 text-sm">{count}</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: elementColors[element] || '#a0aec0'
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{percentage}%</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
        <div className="flex gap-6">
          <span>🖱️ Arraste para mover</span>
          <span>🔍 Use os botões de zoom</span>
          <span>📍 Digite coordenadas para localizar</span>
          <span>⚙️ Configure e gere mapas personalizados</span>
        </div>
      </div>
    </div>
  );
};

export default MapAnalyzer;