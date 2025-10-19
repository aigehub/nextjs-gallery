import { log } from "console";
import fs from "fs";
/**
 * 公共函数
 *
 */
export function mkdirIfNotExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
export async function retryLoop(retry_count = 0, callback: Function, ...argArray: any) {
  try {
    // log("retryLopp params:", callback.name, ...argArray);
    return await callback(...argArray);
  } catch (e) {
    if (++retry_count > 3) {
      log("retry loading over 3");
      return null;
    }
    log(e, "retry loading retry_count:", retry_count);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return retryLoop(retry_count, callback, ...argArray);
  }
}

export async function timeCost(callback: Function, ...argArray: any) {
  const start = Date.now();
  const res = await callback(...argArray);
  const end = Date.now();
  log(`timeCost: ${callback.name} cost ${end - start} ms ${(end - start) / 1000 / 60} 分钟`);
  return res;
}
