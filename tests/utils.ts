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
export async function retryLopp(retry_count = 0, callback: Function, ...argArray: any) {
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
    return retryLopp(retry_count, callback, ...argArray);
  }
}