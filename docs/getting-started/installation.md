# Installation Guide

This guide will walk you through setting up Pioneer Village for development. The process involves setting up the development environment, database, and server configuration.

## Prerequisites

### Required Software

#### Node.js (Required Version: 16.13.2)
```bash
# Check your Node.js version
node --version
```

**Important**: Pioneer Village requires Node.js 16.13.2 for development. While CFX uses 16.9.1, Drizzle v5 requires 16.13.x minimum. Using 16.13.2 ensures compatibility with all components.

- **Download**: [Node.js 16.13.2](https://nodejs.org/download/release/v16.13.2/)
- **Recommendation**: Use [nvm](https://github.com/nvm-sh/nvm) for Node.js version management

#### PostgreSQL Database
Pioneer Village uses PostgreSQL for persistent data storage.

- **Download**: [PostgreSQL](https://www.postgresql.org/download/)
- **Alternative**: Use [Docker](https://hub.docker.com/_/postgres) for easy setup

#### Git
Required for cloning the repository and version control.

- **Download**: [Git](https://git-scm.com/downloads)

### Optional but Recommended

#### IDE/Editor with TypeScript Support
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - GitLens
- **WebStorm**
- **Neovim** with TypeScript LSP

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/spAnser/pioneer-village.git
cd pioneer-village
```

### 2. Database Setup

#### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL** following the official documentation
2. **Create a database** for Pioneer Village:
   ```sql
   CREATE DATABASE redm;
   ```
3. **Note your connection details** (host, port, username, password)

#### Option B: Docker PostgreSQL (Recommended for Development)

```bash
# Create and start PostgreSQL container
docker run --name pioneer-postgres \
  -e POSTGRES_DB=redm \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14

# Verify container is running
docker ps
```

### 3. Environment Configuration

#### Copy Environment Template
```bash
cp .env.example .env
```

#### Configure Environment Variables
Edit `.env` with your database connection details:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/redm"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="redm"

# Server Configuration
SOCKET_PORT=3001
SOCKET_HOST="localhost"

# Development
NODE_ENV="development"
```

#### Configure Server Settings
```bash
cp local.cfg.example local.cfg
```

Edit `local.cfg` with your server credentials:
```cfg
# Required: Get from https://keymaster.fivem.net/
sv_licenseKey "YOUR_LICENSE_KEY_HERE"

# Optional: Get from https://steamcommunity.com/dev/apikey
steam_webApiKey "YOUR_STEAM_API_KEY_HERE"

# Server Identity
sv_hostname "Pioneer Village Development Server"
```

### 4. Install Dependencies

#### Root Dependencies
```bash
yarn install
```

#### Session Manager Dependencies
```bash
cd resources/[system]/sessionmanager-rdr3
yarn install
cd ../../..
```

### 5. Database Setup

#### Initialize Database Schema
```bash
# Push schema to database
yarn db:push

# Optional: Open database studio for inspection
yarn db:studio
```

### 6. Download Server Artifacts

```bash
# Download FXServer binaries
yarn download-server
```

This downloads the FXServer version specified in `package.json` (currently 14862).

### 7. Build Resources

```bash
# Build all resources
yarn build
```

### 8. Start Development Environment

#### Terminal 1: Build & Watch Resources + Socket Server
```bash
yarn watch
```

This command:
- Builds all resources in watch mode
- Starts the Socket.IO server
- Enables hot reload for development

#### Terminal 2: Start Game Server
```bash
yarn start
```

This starts the FXServer with the configured resources.

## Verification

### 1. Check Server Status

The game server should start without errors. Look for:
```
Started resource: base
Started resource: ui  
Started resource: init
[Socket] Server listening on port 3001
```

### 2. Database Connection

Verify database connectivity:
```bash
# Open database studio
yarn db:studio
```

### 3. Resource Status

In-game or server console, check resource status:
```
resource list
```

All core resources should show as "started".

## Development Workflow

### Hot Reload Development
With `yarn watch` running:
1. **Edit TypeScript files** in any resource
2. **Rspack automatically rebuilds** the changed resources
3. **Resources restart automatically** in the server
4. **Test changes immediately** without manual rebuilds

### Database Schema Changes
When modifying database schema:
```bash
# Generate migration
yarn db:generate

# Apply changes
yarn db:push
```

### Creating New Resources
```bash
# Create a new resource from boilerplate
yarn create-resource my-new-resource

# For core resources
yarn create-resource [core]/my-core-resource
```

## Common Installation Issues

### Node.js Version Mismatch
**Error**: `package.json engines field`
**Solution**: Ensure Node.js 16.13.2 is installed

### Database Connection Failed
**Error**: `ECONNREFUSED` or connection timeout
**Solution**: 
1. Verify PostgreSQL is running
2. Check connection details in `.env`
3. Ensure database exists

### License Key Missing
**Error**: Server won't start, license key required
**Solution**: Add valid license key to `local.cfg`

### Port Already in Use
**Error**: `EADDRINUSE` on port 3001 or 30120
**Solution**: 
1. Stop other FXServer instances
2. Change ports in configuration files

### Build Failures
**Error**: TypeScript compilation errors
**Solution**:
1. Ensure all dependencies are installed
2. Check for syntax errors in modified files
3. Run `yarn build` to see detailed errors

## Next Steps

Once installation is complete:

1. **[Quick Start Guide](quick-start.md)** - Create your first resource
2. **[Architecture Overview](architecture-overview.md)** - Understand the system
3. **[Development Environment](../development/environment-setup.md)** - Optimize your workflow

## Getting Help

If you encounter issues:

1. **Check the [Troubleshooting Guide](../troubleshooting/common-issues.md)**
2. **Review error messages** in both terminals
3. **Verify all prerequisites** are correctly installed
4. **Check GitHub Issues** for known problems

---

*Installation complete? Time to build something amazing with Pioneer Village!*
