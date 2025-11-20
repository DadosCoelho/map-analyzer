import json
import random
import numpy as np
from typing import List, Dict, Tuple, Set
from dataclasses import dataclass
from enum import Enum

@dataclass
class Position:
    x: int
    y: int
    
    def __hash__(self):
        return hash((self.x, self.y))
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

class MapGenerator:
    def __init__(self, config_path: str):
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        
        self.width = self.config['dimensions']['width']
        self.height = self.config['dimensions']['height']
        self.map_grid = [[None for _ in range(self.width)] for _ in range(self.height)]
        self.occupied_positions: Set[Position] = set()
        
    def generate(self) -> List[List]:
        """Gera o mapa completo baseado na configuração"""
        print("Gerando mapa...")
        
        # 1. Gera barreiras primeiro
        self._generate_barriers()
        
        # 2. Gera elementos
        self._generate_elements()
        
        # 3. Valida restrições
        if not self._validate_restrictions():
            print("⚠️ Aviso: Algumas restrições podem ter sido violadas")
        
        return self.map_grid
    
    def _generate_barriers(self):
        """Gera barreiras no mapa"""
        if 'barriers' not in self.config:
            return
        
        for barrier_config in self.config['barriers']:
            barrier_type = barrier_config['type']
            
            if barrier_type == 'perimeter':
                self._create_perimeter()
            elif barrier_type == 'random':
                self._create_random_barriers(barrier_config)
            elif barrier_type == 'line':
                self._create_line_barrier(barrier_config)
            elif barrier_type == 'rectangle':
                self._create_rectangle_barrier(barrier_config)
    
    def _create_perimeter(self):
        """Cria barreiras no perímetro do mapa"""
        for x in range(self.width):
            self._place_at(Position(x, 0), 'barrier')
            self._place_at(Position(x, self.height - 1), 'barrier')
        
        for y in range(self.height):
            self._place_at(Position(0, y), 'barrier')
            self._place_at(Position(self.width - 1, y), 'barrier')
    
    def _create_random_barriers(self, config: Dict):
        """Cria barreiras aleatórias"""
        count = config.get('count', 10)
        symbol = config.get('symbol', '#')
        
        placed = 0
        attempts = 0
        max_attempts = count * 10
        
        while placed < count and attempts < max_attempts:
            pos = Position(random.randint(0, self.width - 1), 
                          random.randint(0, self.height - 1))
            
            if self._is_free(pos):
                self._place_at(pos, symbol)
                placed += 1
            
            attempts += 1
    
    def _create_line_barrier(self, config: Dict):
        """Cria uma linha de barreiras"""
        start = config['start']
        end = config['end']
        symbol = config.get('symbol', '#')
        
        x0, y0 = start['x'], start['y']
        x1, y1 = end['x'], end['y']
        
        # Algoritmo de Bresenham simplificado
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy
        
        x, y = x0, y0
        while True:
            if 0 <= x < self.width and 0 <= y < self.height:
                self._place_at(Position(x, y), symbol)
            
            if x == x1 and y == y1:
                break
            
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy
    
    def _create_rectangle_barrier(self, config: Dict):
        """Cria um retângulo de barreiras"""
        x = config['x']
        y = config['y']
        width = config['width']
        height = config['height']
        symbol = config.get('symbol', '#')
        filled = config.get('filled', False)
        
        for i in range(width):
            for j in range(height):
                if filled or i == 0 or i == width - 1 or j == 0 or j == height - 1:
                    pos_x = x + i
                    pos_y = y + j
                    if 0 <= pos_x < self.width and 0 <= pos_y < self.height:
                        self._place_at(Position(pos_x, pos_y), symbol)
    
    def _generate_elements(self):
        """Gera elementos no mapa"""
        if 'elements' not in self.config:
            return
        
        for element_config in self.config['elements']:
            self._place_element(element_config)
    
    def _place_element(self, element_config: Dict):
        """Coloca um tipo de elemento no mapa"""
        symbol = element_config['symbol']
        count = element_config.get('count', 1)
        strategy = element_config.get('placement', 'random')
        
        placed = 0
        attempts = 0
        max_attempts = count * 20
        
        while placed < count and attempts < max_attempts:
            if strategy == 'random':
                pos = self._get_random_free_position()
            elif strategy == 'clustered':
                pos = self._get_clustered_position(symbol)
            elif strategy == 'scattered':
                pos = self._get_scattered_position(symbol)
            else:
                pos = self._get_random_free_position()
            
            if pos and self._can_place_element(pos, element_config):
                self._place_at(pos, symbol)
                placed += 1
            
            attempts += 1
        
        if placed < count:
            print(f"⚠️ Apenas {placed}/{count} elementos '{symbol}' foram colocados")
    
    def _get_random_free_position(self) -> Position:
        """Retorna uma posição livre aleatória"""
        attempts = 0
        while attempts < 100:
            pos = Position(random.randint(0, self.width - 1),
                          random.randint(0, self.height - 1))
            if self._is_free(pos):
                return pos
            attempts += 1
        return None
    
    def _get_clustered_position(self, symbol: str) -> Position:
        """Retorna uma posição próxima a elementos similares"""
        existing = self._find_positions_with(symbol)
        
        if not existing:
            return self._get_random_free_position()
        
        # Tenta colocar próximo a um elemento existente
        ref_pos = random.choice(existing)
        
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                pos = Position(ref_pos.x + dx, ref_pos.y + dy)
                if self._is_valid_position(pos) and self._is_free(pos):
                    return pos
        
        return self._get_random_free_position()
    
    def _get_scattered_position(self, symbol: str) -> Position:
        """Retorna uma posição longe de elementos similares"""
        existing = self._find_positions_with(symbol)
        
        best_pos = None
        best_min_dist = 0
        
        for _ in range(20):
            pos = self._get_random_free_position()
            if not pos:
                continue
            
            if not existing:
                return pos
            
            min_dist = min(abs(pos.x - e.x) + abs(pos.y - e.y) for e in existing)
            
            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_pos = pos
        
        return best_pos or self._get_random_free_position()
    
    def _can_place_element(self, pos: Position, element_config: Dict) -> bool:
        """Verifica se um elemento pode ser colocado na posição"""
        if not self._is_free(pos):
            return False
        
        # Verifica restrições de proximidade
        if 'restrictions' in self.config:
            symbol = element_config['symbol']
            
            for restriction in self.config['restrictions']:
                if restriction['element'] == symbol:
                    cannot_touch = restriction.get('cannot_touch', [])
                    min_distance = restriction.get('min_distance', 1)
                    
                    if not self._check_distance_restriction(pos, cannot_touch, min_distance):
                        return False
        
        return True
    
    def _check_distance_restriction(self, pos: Position, forbidden: List[str], 
                                   min_dist: int) -> bool:
        """Verifica se a posição respeita distâncias mínimas"""
        for dx in range(-min_dist, min_dist + 1):
            for dy in range(-min_dist, min_dist + 1):
                check_pos = Position(pos.x + dx, pos.y + dy)
                
                if not self._is_valid_position(check_pos):
                    continue
                
                cell = self.map_grid[check_pos.y][check_pos.x]
                if cell in forbidden:
                    return False
        
        return True
    
    def _validate_restrictions(self) -> bool:
        """Valida todas as restrições após gerar o mapa"""
        if 'restrictions' not in self.config:
            return True
        
        valid = True
        
        for restriction in self.config['restrictions']:
            element = restriction['element']
            cannot_touch = restriction.get('cannot_touch', [])
            min_distance = restriction.get('min_distance', 1)
            
            positions = self._find_positions_with(element)
            
            for pos in positions:
                if not self._check_distance_restriction(pos, cannot_touch, min_distance):
                    valid = False
                    print(f"⚠️ Restrição violada: '{element}' em ({pos.x}, {pos.y})")
        
        return valid
    
    def _is_free(self, pos: Position) -> bool:
        """Verifica se uma posição está livre"""
        return (self._is_valid_position(pos) and 
                self.map_grid[pos.y][pos.x] is None)
    
    def _is_valid_position(self, pos: Position) -> bool:
        """Verifica se uma posição está dentro dos limites"""
        return 0 <= pos.x < self.width and 0 <= pos.y < self.height
    
    def _place_at(self, pos: Position, symbol: str):
        """Coloca um símbolo em uma posição"""
        if self._is_valid_position(pos):
            self.map_grid[pos.y][pos.x] = symbol
            self.occupied_positions.add(pos)
    
    def _find_positions_with(self, symbol: str) -> List[Position]:
        """Encontra todas as posições com um determinado símbolo"""
        positions = []
        for y in range(self.height):
            for x in range(self.width):
                if self.map_grid[y][x] == symbol:
                    positions.append(Position(x, y))
        return positions
    
    def display(self):
        """Exibe o mapa no console"""
        print("\n" + "="*self.width)
        for row in self.map_grid:
            line = ""
            for cell in row:
                line += cell if cell else '.'
            print(line)
        print("="*self.width + "\n")
    
    def save_to_file(self, filename: str):
        """Salva o mapa em um arquivo"""
        with open(filename, 'w', encoding='utf-8') as f:
            for row in self.map_grid:
                line = "".join(cell if cell else '.' for cell in row)
                f.write(line + '\n')
        print(f"✓ Mapa salvo em '{filename}'")
    
    def get_statistics(self):
        """Retorna estatísticas do mapa"""
        stats = {}
        for y in range(self.height):
            for x in range(self.width):
                cell = self.map_grid[y][x]
                if cell:
                    stats[cell] = stats.get(cell, 0) + 1
        
        print("\n📊 Estatísticas do Mapa:")
        print(f"Dimensões: {self.width}x{self.height}")
        print(f"Células livres: {self.width * self.height - len(self.occupied_positions)}")
        for symbol, count in sorted(stats.items()):
            print(f"  '{symbol}': {count}")


# Exemplo de uso
if __name__ == "__main__":
    # Gera o mapa
    generator = MapGenerator('map_config.json')
    mapa = generator.generate()
    
    # Exibe o mapa
    generator.display()
    
    # Mostra estatísticas
    generator.get_statistics()
    
    # Salva em arquivo
    generator.save_to_file('generated_map.txt')