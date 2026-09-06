export function createBrowserLaunchError(error, executablePath) {
  const details = error instanceof Error ? error.message : String(error);
  const restrictedEnvironment =
    /MachPortRendezvousServer|Permission denied|Operation not permitted|Target page, context or browser has been closed/i.test(
      details
    );

  if (restrictedEnvironment) {
    return new Error(
      [
        `Chromium could not start in the current restricted environment: ${executablePath}.`,
        "Run `npm run export:pdf` in a local terminal (or export-pdf.cmd on Windows,",
        "./export-pdf.sh on macOS/Linux), or allow the environment to launch a headless browser.",
        "Setting CHROME_PATH selects a browser, but does not bypass sandbox permissions."
      ].join(" ")
    );
  }

  const firstLine = details.split("\n", 1)[0];
  return new Error(
    `Chromium failed to start: ${executablePath}. ${firstLine}`
  );
}
