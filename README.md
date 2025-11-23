# 🗺️ Map Analyzer - Gerador e Analisador de Mapas 2D

Um sistema completo para criação, visualização e análise de mapas 2D procedurais com interface interativa em React e gerador em Python.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)
![Python](https://img.shields.io/badge/Python-3.8+-3776ab.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Índice

- [Características](#características)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Configuração de Mapas](#configuração-de-mapas)
- [Interface Web](#interface-web)
- [Gerador Python](#gerador-python)
- [Exemplos](#exemplos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## ✨ Características

### Interface Web (React)
- 🎨 **Editor Visual Interativo** - Crie mapas através de uma interface intuitiva
- 🔍 **Zoom e Pan** - Navegue facilmente por mapas de qualquer tamanho
- 📊 **Análise em Tempo Real** - Estatísticas detalhadas de elementos
- 🎯 **Sistema de Filtros** - Isole e analise elementos específicos
- 📍 **Busca por Coordenadas** - Localize posições instantaneamente
- 💾 **Configuração Persistente** - Salve suas configurações como padrão
- 📤 **Exportação** - Exporte mapas e análises em múltiplos formatos

### Gerador Python
- 🎲 **Geração Procedural** - Algoritmos avançados de geração
- 🧱 **Múltiplos Tipos de Barreiras** - Perímetro, aleatório, linhas, retângulos
- 🎯 **Estratégias de Posicionamento** - Random, clustered, scattered
- 🚫 **Sistema de Restrições** - Defina regras de proximidade entre elementos
- 📝 **Configuração via JSON** - Fácil customização e compartilhamento
- ✅ **Validação Automática** - Verifica violações de restrições

## 🔧 Pré-requisitos

### Para a Interface Web:
- Node.js 14.0 ou superior
- npm 6.0 ou superior

### Para o Gerador Python:
- Python 3.8 ou superior
- pip

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/map-analyzer.git
cd map-analyzer
```

### 2. Instalar Dependências da Interface Web

```bash
# Instalar dependências do React
npm install

# Instalar lucide-react para ícones
npm install lucide-react
```

### 3. Instalar Dependências Python (Opcional)

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Instalar dependências
pip install numpy
```

## 🚀 Como Usar

### Interface Web

```bash
# Iniciar servidor de desenvolvimento
npm start
```

A aplicação será aberta em `http://localhost:3000`

### Gerador Python

```bash
# Executar gerador com arquivo de configuração
python src/utils/mapGenerator.py

# O mapa será gerado e salvo em 'generated_map.txt'
```

## ⚙️ Configuração de Mapas

### Estrutura do JSON de Configuração

```json
{
  "dimensions": {
    "width": 50,
    "height": 30
  },
  "barriers": [
    {
      "type": "perimeter",
      "symbol": "#"
    },
    {
      "type": "random",
      "count": 30,
      "symbol": "#"
    }
  ],
  "elements": [
    {
      "symbol": "P",
      "count": 1,
      "placement": "random"
    },
    {
      "symbol": "E",
      "count": 5,
      "placement": "scattered"
    }
  ],
  "restrictions": [
    {
      "element": "P",
      "cannot_touch": ["E", "#"],
      "min_distance": 2
    }
  ]
}
```

### Tipos de Barreiras

| Tipo | Descrição | Parâmetros |
|------|-----------|------------|
| `perimeter` | Cria bordas ao redor do mapa | `symbol` |
| `random` | Obstáculos aleatórios | `symbol`, `count` |
| `line` | Linha entre dois pontos | `symbol`, `start`, `end` |
| `rectangle` | Retângulo ou sala | `symbol`, `x`, `y`, `width`, `height`, `filled` |

### Estratégias de Posicionamento

- **random** - Posicionamento completamente aleatório
- **clustered** - Agrupa elementos próximos uns aos outros
- **scattered** - Distribui elementos o mais distante possível

### Sistema de Restrições

```json
{
  "element": "P",
  "cannot_touch": ["E", "M", "#"],
  "min_distance": 3
}
```

- `element` - Símbolo do elemento a restringir
- `cannot_touch` - Lista de símbolos que não podem estar próximos
- `min_distance` - Distância mínima em células

## 🖥️ Interface Web

### Barra de Ferramentas

- **Criar Mapa** - Abre o editor de configuração
- **Carregar Mapa** - Importa mapa de arquivo .txt
- **Zoom In/Out** - Controles de zoom
- **Tamanho de Célula** - Ajusta visualização (8px-24px)
- **Toggle Grid** - Ativa/desativa grade
- **Reset** - Volta à visualização inicial
- **Exportar** - Salva análise em JSON

### Painel de Criação

#### Aba Dimensões
Configure largura e altura do mapa

#### Aba Barreiras
- Adicione múltiplas barreiras
- Configure tipo e parâmetros
- Remova barreiras indesejadas

#### Aba Elementos
- Defina símbolos e quantidades
- Escolha estratégias de posicionamento
- Gerencie múltiplos tipos de elementos

#### Aba Restrições
- Crie regras de proximidade
- Defina elementos incompatíveis
- Configure distâncias mínimas

### Painel de Análise

- **Informações** - Dimensões e estatísticas gerais
- **Filtros** - Isole elementos específicos
- **Elementos** - Visualize distribuição e porcentagens

### Controles de Navegação

- **Arrastar** - Mova o mapa clicando e arrastando
- **Zoom** - Use os botões ou scroll do mouse
- **Busca** - Digite coordenadas X,Y para localizar
- **Hover** - Passe o mouse para ver informações da célula

## 🐍 Gerador Python

### Exemplo de Uso

```python
from mapGenerator import MapGenerator

# Criar gerador com arquivo de configuração
generator = MapGenerator('map_config.json')

# Gerar mapa
mapa = generator.generate()

# Exibir no console
generator.display()

# Mostrar estatísticas
generator.get_statistics()

# Salvar em arquivo
generator.save_to_file('meu_mapa.txt')
```

### Métodos Principais

- `generate()` - Gera o mapa completo
- `display()` - Exibe mapa no console
- `get_statistics()` - Mostra estatísticas
- `save_to_file(filename)` - Salva mapa em arquivo

## 📚 Exemplos

### Exemplo 1: Dungeon Simples

```json
{
  "dimensions": { "width": 40, "height": 20 },
  "barriers": [
    { "type": "perimeter", "symbol": "#" },
    { "type": "random", "count": 30, "symbol": "#" }
  ],
  "elements": [
    { "symbol": "@", "count": 1, "placement": "random" },
    { "symbol": "E", "count": 5, "placement": "scattered" },
    { "symbol": "$", "count": 10, "placement": "clustered" }
  ],
  "restrictions": [
    { "element": "@", "cannot_touch": ["E"], "min_distance": 3 }
  ]
}
```

### Exemplo 2: Arena de Combate

```json
{
  "dimensions": { "width": 30, "height": 30 },
  "barriers": [
    { "type": "perimeter", "symbol": "■" },
    {
      "type": "rectangle",
      "x": 5, "y": 5,
      "width": 8, "height": 8,
      "filled": true,
      "symbol": "▒"
    }
  ],
  "elements": [
    { "symbol": "A", "count": 1, "placement": "random" },
    { "symbol": "B", "count": 1, "placement": "random" },
    { "symbol": "+", "count": 5, "placement": "scattered" }
  ],
  "restrictions": [
    { "element": "A", "cannot_touch": ["B"], "min_distance": 10 }
  ]
}
```

### Exemplo 3: Floresta

```json
{
  "dimensions": { "width": 60, "height": 40 },
  "barriers": [
    { "type": "perimeter", "symbol": "▓" },
    { "type": "random", "count": 100, "symbol": "♣" }
  ],
  "elements": [
    { "symbol": "⌂", "count": 1, "placement": "random" },
    { "symbol": "♠", "count": 200, "placement": "clustered" },
    { "symbol": "◊", "count": 15, "placement": "scattered" }
  ],
  "restrictions": [
    { "element": "⌂", "cannot_touch": ["♣"], "min_distance": 3 },
    { "element": "◊", "cannot_touch": ["◊"], "min_distance": 5 }
  ]
}
```

## 📁 Estrutura do Projeto

```
map-analyzer/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── MapAnalyzer.jsx      # Componente principal
│   │   └── MapAnalyzer.css      # Estilos do componente
│   ├── utils/
│   │   └── mapGenerator.py      # Gerador Python
│   ├── App.js                   # App principal
│   ├── App.css                  # Estilos do app
│   ├── index.js                 # Entry point
│   └── index.css                # Estilos globais
├── examples/
│   ├── dungeon_config.json      # Exemplo de dungeon
│   ├── arena_config.json        # Exemplo de arena
│   └── forest_config.json       # Exemplo de floresta
├── package.json
├── README.md
└── .gitignore
```

## 🛠️ Tecnologias

### Frontend
- React 18+
- Lucide React (ícones)
- HTML5 Canvas
- CSS3
- JavaScript ES6+

### Backend/Gerador
- Python 3.8+
- NumPy
- JSON

### Ferramentas
- Create React App
- Node.js
- npm

## 🎯 Casos de Uso

- 🎮 **Desenvolvimento de Jogos** - Gere mapas procedurais para jogos 2D
- 🗺️ **Planejamento de Níveis** - Crie e teste layouts de níveis
- 📊 **Visualização de Dados** - Represente dados espaciais
- 🎲 **RPG de Mesa** - Gere masmorras e mapas para aventuras
- 🧪 **Testes e Simulações** - Crie ambientes para testes
- 📚 **Educação** - Ensine algoritmos de geração procedural

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] Suporte a múltiplas camadas (layers)
- [ ] Exportação em PNG/SVG
- [ ] Importação de imagens
- [ ] Sistema de templates
- [ ] Algoritmos de pathfinding
- [ ] Modo colaborativo em tempo real
- [ ] Plugins e extensões
- [ ] Geração 3D

## ⚠️ Solução de Problemas

### Erro: "Module not found"
```bash
npm install
```

### Mapa não renderiza
- Verifique se o arquivo está no formato correto
- Confirme que todas as células têm o mesmo comprimento

### Performance lenta
- Reduza o tamanho das células (8px)
- Diminua o zoom
- Use filtros para visualizar menos elementos

### Python não gera mapa
- Verifique o arquivo JSON de configuração
- Confirme que numpy está instalado
- Verifique permissões de escrita

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.


## 🙏 Agradecimentos

- Inspirado em geradores procedurais de jogos roguelike
- Comunidade React pela excelente documentação
- Todos os contribuidores que ajudaram este projeto

---