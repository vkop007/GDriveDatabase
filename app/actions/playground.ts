"use server";

import { GDatabase } from "gdatabase";

interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
  duration: number;
}

export async function executePlaygroundCode(
  code: string,
  apiKey: string,
  baseUrl: string
): Promise<ExecutionResult> {
  const output: string[] = [];
  const startTime = Date.now();

  // Create a custom console that captures logs
  const capturedConsole = {
    log: (...args: any[]) => {
      output.push(
        args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")
      );
    },
    error: (...args: any[]) => {
      output.push(
        `[ERROR] ${args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")}`
      );
    },
    warn: (...args: any[]) => {
      output.push(
        `[WARN] ${args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")}`
      );
    },
    info: (...args: any[]) => {
      output.push(
        `[INFO] ${args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")}`
      );
    },
  };

  try {
    // Initialize the GDatabase client
    const db = new GDatabase(apiKey, baseUrl);

    // Create the async function from user code
    // The function has access to: db, console
    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;
    const userFunction = new AsyncFunction(
      "db",
      "console",
      `
      ${code}
      `
    );

    // Execute the user's code
    const result = await userFunction(db, capturedConsole);

    // If the code returns something, add it to output
    if (result !== undefined) {
      output.push(
        `\n→ ${
          typeof result === "object"
            ? JSON.stringify(result, null, 2)
            : String(result)
        }`
      );
    }

    return {
      success: true,
      output,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      output,
      error: error.message || String(error),
      duration: Date.now() - startTime,
    };
  }
}
