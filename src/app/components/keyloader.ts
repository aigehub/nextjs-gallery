import { Fragment, KeyLoadedData, KeyLoader, KeyLoaderInfo } from "hls.js";

export default class MyHlsKeyLoader extends KeyLoader {
  createResolve(keyInfo: KeyLoaderInfo, frag: Fragment) {
    // console.log("createResolve", keyInfo, frag);
    const s = "eTF3th9UmVZC8J0n",
      i = new Uint8Array(16);
    for (let r = 0; r < 16; r++) i[r] = s.charCodeAt(r);
    return (
      (keyInfo.decryptdata.key = i),
      frag.decryptdata && (frag.decryptdata.key = i),
      Promise.resolve({
        frag: frag,
        keyInfo: keyInfo,
      })
    );
  }
  loadKeyHTTP(keyInfo: KeyLoaderInfo, frag: Fragment): Promise<KeyLoadedData> {
    const key = "https://test.xn--fiqa24e59ix1fezpezjsm1b4qeqwm.com:2000/key/enc.key";
    if (keyInfo.decryptdata.uri.endsWith("key/enc.key") || keyInfo.decryptdata.uri.includes(key)) {
      return this.createResolve(keyInfo, frag);
    }
    return super.loadKeyHTTP(keyInfo, frag);
  }
}
