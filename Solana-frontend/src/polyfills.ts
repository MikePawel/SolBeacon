import { Buffer } from "buffer";
import process from "process";

// Setting global Buffer for browser environment
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.global = window;
  window.process = process;
}

export { Buffer, process };
