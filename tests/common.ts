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
