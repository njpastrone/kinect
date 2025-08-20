# Kinect Monorepo - Package Updates Migration Guide

## Summary of Updates

This document outlines the package updates applied to modernize the Kinect monorepo and replace deprecated packages.

### ✅ Completed Updates

#### 1. ESLint Migration (v8.57.1 → v9.12.0)

- **Updated**: ESLint to version 9.x with flat configuration
- **Changed**: `.eslintrc.json` → `eslint.config.mjs`
- **Updated**: @typescript-eslint packages to v8.8.0
- **Updated**: eslint-plugin-react-hooks to v5.0.0

**Breaking Changes:**

- New flat config format requires different syntax
- Some rule names may have changed
- Configuration now uses ES modules

#### 2. Package Updates Across Monorepo

**Root package.json:**

- concurrently: ^8.2.2 → ^9.0.1
- husky: ^9.0.11 → ^9.1.6
- prettier: ^3.2.5 → ^3.3.3
- Added: glob ^11.0.0, rimraf ^6.0.1, @xmldom/xmldom ^0.9.3

**Backend package.json:**

- typescript: ^5.3.3 → ^5.6.2
- nodemon: ^3.1.0 → ^3.1.7
- @types/node: ^20.11.24 → ^22.7.4
- ts-jest: ^29.1.2 → ^29.2.5
- Added: rimraf ^6.0.1, glob ^11.0.0

**Frontend-web package.json:**

- react: ^18.2.0 → ^18.3.1
- react-dom: ^18.2.0 → ^18.3.1
- axios: ^1.6.7 → ^1.7.7
- react-hook-form: ^7.50.1 → ^7.53.0
- react-router-dom: ^6.22.1 → ^6.26.2
- zustand: ^4.5.1 → ^5.0.0
- typescript: ^5.3.3 → ^5.6.2
- vite: ^5.1.4 → ^5.4.8
- vitest: ^1.3.1 → ^2.1.2
- @vitejs/plugin-react: ^4.2.1 → ^4.3.2
- tailwindcss: ^3.4.1 → ^3.4.13
- Added: rimraf ^6.0.1, glob ^11.0.0

**iOS app package.json:**

- expo: ~50.0.7 → ~51.0.38
- react-native: 0.73.4 → 0.74.5
- axios: ^1.6.7 → ^1.7.7
- react-hook-form: ^7.50.1 → ^7.53.0
- zustand: ^4.5.1 → ^5.0.0
- @babel/core: ^7.20.0 → ^7.25.7
- typescript: ^5.3.3 → ^5.6.2
- Added: Modern Babel transform plugins, glob ^11.0.0

**Shared package.json:**

- typescript: ^5.3.3 → ^5.6.2
- Added: rimraf ^6.0.1, glob ^11.0.0

#### 3. Babel Plugin Updates

- **Replaced**: All @babel/plugin-proposal-_ with @babel/plugin-transform-_
- **Added**: Explicit Babel configuration for iOS app
- **Plugins**:
  - @babel/plugin-transform-class-properties
  - @babel/plugin-transform-private-methods
  - @babel/plugin-transform-nullish-coalescing-operator
  - @babel/plugin-transform-optional-chaining
  - @babel/plugin-transform-logical-assignment-operators

#### 4. Package Replacements

- **glob**: Updated to v11.0.0 across all packages
- **rimraf**: Updated to v6.0.1 across all packages
- **@xmldom/xmldom**: Added at v0.9.3 (security fix)
- **@humanwhocodes packages**: Automatically replaced by ESLint 9.x internal packages

#### 5. Script Updates

- **Added**: Clean scripts using rimraf in all packages
- **Updated**: Build scripts to clean before building
- **Updated**: Husky prepare script to use modern syntax
- **Added**: build:all and clean scripts to root package.json

### 🔧 Required Actions After Update

#### 1. Install Updated Dependencies

```bash
# Remove node_modules and package-lock files
npm run clean
rm -rf node_modules package-lock.json
find . -name "node_modules" -type d -not -path "./node_modules" -exec rm -rf {} +
find . -name "package-lock.json" -not -path "./node_modules/*" -delete

# Install fresh dependencies
npm install
```

#### 2. Husky Reinstall

```bash
# Reinstall Husky hooks
npm run prepare
```

#### 3. ESLint Configuration

The ESLint configuration has been migrated to the new flat config format. The new configuration:

- Uses `eslint.config.mjs` instead of `.eslintrc.json`
- Supports the latest ESLint 9.x features
- Maintains all existing rules and settings

#### 4. Test the Build Process

```bash
# Test builds for all packages
npm run build:all

# Test linting
npm run lint

# Test formatting
npm run format
```

### ⚠️ Potential Breaking Changes

#### Zustand v5.0.0

- **Impact**: State management API changes
- **Action**: Review store implementations for API changes
- **Files to check**:
  - `frontend-web/src/hooks/useAuth.ts`
  - `frontend-web/src/hooks/useContacts.ts`

#### React Router v6.26.2

- **Impact**: Minor API updates
- **Action**: Verify routing still works correctly

#### Vite v5.4.8

- **Impact**: Build configuration changes
- **Action**: Test development and build processes

#### React Native/Expo Updates

- **Impact**: Native dependency changes
- **Action**: Test iOS app functionality

### 🔍 Verification Steps

1. **ESLint**: Run `npm run lint` - should complete without errors
2. **Prettier**: Run `npm run format` - should format files correctly
3. **Build**: Run `npm run build:all` - all packages should build
4. **Development**: Run `npm run dev:all` - dev servers should start
5. **Husky**: Make a test commit - pre-commit hooks should run

### 📝 Notes

- All updates maintain backward compatibility where possible
- Security vulnerabilities in dependencies have been addressed
- Modern package versions improve performance and reduce bundle size
- The monorepo structure remains unchanged
- All TypeScript configurations remain compatible

### 🐛 Troubleshooting

If you encounter issues after the update:

1. **Clear all caches**:

   ```bash
   npm run clean
   npx rimraf node_modules package-lock.json
   npm install
   ```

2. **ESLint issues**: Check the new `eslint.config.mjs` format
3. **Zustand issues**: Review store usage for v5 API changes
4. **Build issues**: Verify TypeScript and build tool configurations
5. **iOS app issues**: Run `npx expo install --fix` to fix Expo dependencies

### 📚 Resources

- [ESLint 9.0 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Zustand v5 Migration](https://github.com/pmndrs/zustand/releases/tag/v5.0.0)
- [Babel Transform Plugins](https://babeljs.io/docs/en/plugins-list#transform-plugins)
- [Vite 5.0 Migration](https://vitejs.dev/guide/migration.html)
