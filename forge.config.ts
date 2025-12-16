import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import path from 'node:path';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { config as appConfig } from './src/shared/config';
import { MakerDMG } from '@electron-forge/maker-dmg';

const config: ForgeConfig = {
  packagerConfig: {
    name: appConfig.app.name,
    asar: true,
    appCategoryType: appConfig.app.macCategory,
    icon: path.resolve(__dirname, 'assets/icon'),
    ignore: [
      /node_modules\/(?!(better-sqlite3|bindings|file-uri-to-path)\/)/,
      // Also ignore source and dev-specific files to keep the installer light
      /\.vscode/,
      /\.git/,
      /src\//,
      /vite\.config\..*/,
    ],
    appBundleId: appConfig.app.bundleId,
    executableName: appConfig.app.executableName,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: appConfig.app.name,
      authors: appConfig.app.author,
      description: appConfig.app.description,
      setupIcon: path.join(__dirname, 'assets/icon.ico'),
      // The GIF that plays during the background installation
      loadingGif: path.join(__dirname, 'assets/installing.gif'),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({
      options: {
        // Matches the executableName set in packagerConfig
        bin: appConfig.app.executableName,
        maintainer: appConfig.github.name,
        homepage: appConfig.github.repoUrl,
      },
    }),
    new MakerDMG({
      icon: path.join(__dirname, 'assets/icon.icns'),
      background: path.join(__dirname, 'assets/dmg-background.png'),
      format: 'ULFO',
      iconSize: 80,
      contents: (opts) => [
        { x: 140, y: 200, type: 'file', path: opts.appPath },
        { x: 520, y: 200, type: 'link', path: '/Applications' },
      ],
      additionalDMGOptions: {
        window: {
          size: { width: 660, height: 400 },
        },
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
    new AutoUnpackNativesPlugin({}),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: appConfig.github.owner,
        name: appConfig.github.repo,
      },
      prerelease: false,
      draft: true, // Uploads as a draft so you can check it before going live
    }),
  ],
};

export default config;
