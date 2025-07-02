# Design Document Generator v0.7.1

A multi-agent system that transforms creative ideas into comprehensive technical specifications using specialized AI agents.

## Current Status: Phase 1 - Internal Testing

**Version:** 0.7.1  *(see src/utils/version.ts: APP_VERSION)*
**Phase:** Online Deployment Preps
**Status:** Resolving Backend Issues

## Features Implemented (Phase 1)

- ✅ Basic React application using Vite
- ✅ TypeScript configuration and type definitions
- ✅ Tailwind CSS styling with custom theme
- ✅ Version management system
- ✅ Responsive layout component
- ✅ Landing page with version display
- ✅ Placeholder components for future phases

## Development Phases

### Phase 1 (Current) - Basic Application
- React + TypeScript + Vite setup
- Tailwind CSS configuration
- Basic project structure
- Version display system
- Placeholder components

### Phase 2 (Planned) - Agent Configuration
- Agent configuration interface
- Role and context management
- Task template system
- Configuration save/load functionality

### Phase 3 (Planned) - LLM Integration
- LLM provider integration
- Agent execution pipeline
- Document generation
- Quality control system

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/design-document-generator.git
cd design-document-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to GitHub Pages.

## Project Structure

```
src/
├── components/          # React components
│   └── Layout.tsx      # Main layout component
├── types/              # TypeScript type definitions
│   └── index.ts        # Core type definitions
├── utils/              # Utility functions
│   └── version.ts      # Version management utilities
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Package Manager:** npm

## Version Control

This project follows semantic versioning (X.Y.Z):
- **Major (X):** Breaking changes
- **Minor (Y):** New features, backwards-compatible
- **Patch (Z):** Bug fixes, minor improvements

> **Note:** The current version is managed by the `APP_VERSION` variable in [`src/utils/version.ts`](src/utils/version.ts). Where possible, reference this variable programmatically in the codebase and documentation generation.

### Development Phases by Version
- `v0.7.x` = Internal Testing
- `v0.8.x` = Alpha Testing  
- `v0.9.x` = Beta Testing
- `v1.x.x` = Production

## Contributing

This project is currently in internal testing phase. Please refer to the development roadmap for planned features.

## License

[Add your license here]

## Support

For questions or support, please [create an issue](https://github.com/yourusername/design-document-generator/issues).
