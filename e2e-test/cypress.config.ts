import { defineConfig } from "cypress";
import * as webpack from "@cypress/webpack-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import fs = require('fs');

const getFiles = (path: string) => {
  return fs.readdirSync(`${__dirname}/${path}`)
}

async function setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): Promise<Cypress.PluginConfigOptions> {

  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    webpack({
      webpackOptions: {
        resolve: {
          extensions: [".ts", ".js"],
          fallback: {
            "string_decoder": require.resolve("string_decoder/")
          },
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              exclude: [/node_modules/],
              use: [
                {
                  loader: "ts-loader",
                },
              ],
            },
            {
              test: /\.feature$/,
              use: [
                {
                  loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                  options: config,
                },
              ],
            },
          ],
        },
      },
    })
  );

  // add simulator GIPOD data set
  const gipodDataFolder = '../ldes-server-simulator/data/gipod';
  config.env.gipodDataSet = getFiles(gipodDataFolder).map(x => `${gipodDataFolder}/${x}`);

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

export default defineConfig({
  e2e: {
    specPattern: "**/*.feature",
    video: false,
    videoUploadOnPasses: false,
    setupNodeEvents,
  },
});