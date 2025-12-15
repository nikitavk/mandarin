# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mandarin Peeling Game - a Christmas/New Year themed casual web game built with Three.js and TypeScript. Players peel a mandarin by swiping across its surface in one continuous touch. The mandarin is a cube-mapped sphere with 6 sides, each containing Voronoi-pattern peel pieces.

## Commands

- `npm run dev` - Start Vite development server
- `npm run build` - Type-check with tsc and build with Vite
- `npm run preview` - Preview production build

## Tech Stack

- **Three.js** - 3D rendering
- **TypeScript** - Strict mode enabled with noUnusedLocals/noUnusedParameters
- **Vite** - Build tool and dev server

## Architecture (from DESIGN.md)

### Core Game Mechanics
- Single continuous touch required for entire game - lifting finger = game over
- 6 sides (cube-mapped sphere), each with 5-8 Voronoi cells
- Edge cells determine rotation direction when side is complete
- Center cells ending a side = game over

### Game States
`TITLE → PLAYING → GAME_OVER | WIN → TITLE`

### Key Data Types
- `EdgeType`: 'top' | 'bottom' | 'left' | 'right' | 'center'
- `PeelCell`: Voronoi polygon with vertices, center, mesh, peeled state, edge classification
- `MandarinSide`: Contains cells array and adjacency map to other sides
- `GameState`: status, currentSide, sides array, touchActive, timing

### Side Adjacency
Standard cube unfolding: FRONT(0), BACK(1), TOP(2), BOTTOM(3), LEFT(4), RIGHT(5)
Each side has adjacent sides for top/bottom/left/right transitions.

### Planned Features
- Voronoi generation (d3-delaunay or custom)
- Quaternion slerp for rotation animation (300ms, ease-out)
- Edge hints with light glow for valid exits
- Future: Telegram Mini App integration, roguelike debuff mode
