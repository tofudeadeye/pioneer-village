# Pioneer Village Documentation

A comprehensive RedM Framework built with TypeScript, featuring a sophisticated architecture for multiplayer game server development.

## Quick Navigation

### 🚀 Getting Started
- [**Overview**](getting-started/overview.md) - What is Pioneer Village and why use it
- [**Installation**](getting-started/installation.md) - Complete setup guide
- [**Quick Start**](getting-started/quick-start.md) - Create your first resource in 5 minutes
- [**Architecture Overview**](getting-started/architecture-overview.md) - Understanding the system design

### 🛠️ Development
- [**Environment Setup**](development/environment-setup.md) - Tools, IDEs, and development workflow
- [**Project Structure**](development/project-structure.md) - Understanding the codebase organization
- [**Build System**](development/build-system.md) - Rspack, Lerna, and build processes
- [**Debugging**](development/debugging.md) - Debugging techniques and tools
- [**Testing**](development/testing.md) - Testing approaches and best practices

### 🏗️ Architecture
- [**Communication Flow**](architecture/communication-flow.md) - Client ↔ Server ↔ Socket ↔ UI flow
- [**Resource System**](architecture/resource-system.md) - Resource lifecycle, exports, and events
- [**Type System**](architecture/type-system.md) - TypeScript patterns and conventions
- [**Library Structure**](architecture/library-structure.md) - Understanding the lib/ folder
- [**Socket Architecture**](architecture/socket-architecture.md) - Real-time communication system

### ⚙️ Core Systems
- [**Initialization**](core-systems/initialization.md) - Init manager and resource startup
- [**UI System**](core-systems/ui-system.md) - UI communication, NUI, and layers
- [**Player Management**](core-systems/player-management.md) - Player tracking and sessions
- [**Database Integration**](core-systems/database-integration.md) - Drizzle ORM and schema management
- [**Events System**](core-systems/events-system.md) - Event patterns and handlers
- [**Jobs System**](core-systems/jobs-system.md) - Job creation and management

### 📦 Resource Development
- [**Creating Resources**](resource-development/creating-resources.md) - Using boilerplate and conventions
- [**Client Development**](resource-development/client-development.md) - Client-side patterns
- [**Server Development**](resource-development/server-development.md) - Server-side patterns
- [**UI Development**](resource-development/ui-development.md) - UI layer development
- [**Exports and Events**](resource-development/exports-and-events.md) - Inter-resource communication
- [**Best Practices**](resource-development/best-practices.md) - Code quality and patterns

### 📚 API Reference
- [**Client Exports**](api-reference/client-exports.md) - All client exports documented
- [**Server Exports**](api-reference/server-exports.md) - All server exports documented
- [**Socket Events**](api-reference/socket-events.md) - Socket event reference
- [**UI Events**](api-reference/ui-events.md) - UI communication events
- [**Types Reference**](api-reference/types-reference.md) - TypeScript interfaces and types

### 💡 Examples
- [**Basic Resource**](examples/basic-resource/) - Complete example resource
- [**UI Integration**](examples/ui-integration/) - UI communication examples
- [**Database Usage**](examples/database-usage/) - Database operation examples
- [**Job Creation**](examples/job-creation/) - Jobs system examples
- [**Advanced Patterns**](examples/advanced-patterns/) - Complex implementation patterns

### 🚀 Deployment
- [**Production Setup**](deployment/production-setup.md) - Production deployment guide
- [**Server Configuration**](deployment/server-configuration.md) - Server configs and performance
- [**Database Setup**](deployment/database-setup.md) - Production database configuration
- [**Monitoring**](deployment/monitoring.md) - Logging, monitoring, and debugging

### 🔧 Troubleshooting
- [**Common Issues**](troubleshooting/common-issues.md) - FAQ and common problems
- [**Error Messages**](troubleshooting/error-messages.md) - Error reference guide
- [**Performance**](troubleshooting/performance.md) - Performance optimization
- [**Migration Guide**](troubleshooting/migration-guide.md) - Upgrading between versions

## Features

### ✨ Architecture Highlights
- **Separated Game and API Server** - Clean separation of concerns
- **Multi-layered Communication** - Client ↔ Server ↔ Socket ↔ UI
- **TypeScript Throughout** - Full type safety and IDE support
- **Resource-based Modular Design** - Scalable plugin architecture
- **Real-time Features** - Socket.IO integration for web services
- **Sophisticated UI System** - Single UI resource with layers, resolution-independent

### 🔧 Development Features
- **Hot Reload** - Fast development cycle with Rspack
- **Monorepo Management** - Lerna for multi-package development
- **Database ORM** - Drizzle for type-safe database operations
- **Resource Generator** - Boilerplate generation for new resources
- **Comprehensive Logging** - Debug and production logging systems

### 🎮 Game Features
- **Player Management** - Advanced player tracking and sessions
- **Jobs System** - Flexible job creation and management
- **Inventory System** - Item management and interactions
- **Character Customization** - Advanced character creation system
- **UI Layers** - Scalable UI system that works at all resolutions

## Community & Support

- **Repository**: [GitHub](https://github.com/spAnser/pioneer-village)
- **Support**: [Patreon](https://www.patreon.com/spAnser)
- **License**: [MIT License](../LICENSE.txt)

## Contributing

This project follows strict coding standards and architectural patterns. Please review the development guides before contributing.

---

*This documentation is generated and maintained using LSP tools for accuracy and TypeScript integration.*
